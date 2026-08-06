const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  const dataPath = path.join(__dirname, '../src/docs/master/university-list.json');
  console.log(`Reading data from: ${dataPath}`);
  
  // Strip BOM if present
  let rawData = fs.readFileSync(dataPath, 'utf-8').replace(/^\uFEFF/, '');
  const universities = JSON.parse(rawData);

  console.log(`Starting to seed ${universities.length} universities...`);

  // Fetch existing AISHE codes to avoid doing an upsert for every single one if they exist.
  const existingUnis = await prisma.university.findMany({ select: { aisheCode: true } });
  const existingCodes = new Set(existingUnis.map(u => u.aisheCode));

  const newUnis = universities
    .filter(u => !existingCodes.has(u.aishe_code))
    .map(u => ({
      aisheCode: u.aishe_code,
      name: u.name,
      state: u.state,
      district: u.district,
      website: u.website,
      yearOfEstablishment: parseInt(u.year_of_establishment) || null,
      location: u.location
    }));

  if (newUnis.length > 0) {
    console.log(`Found ${newUnis.length} new universities. Inserting in bulk...`);
    // Insert in chunks of 500 to prevent MongoDB payload too large errors
    const chunkSize = 500;
    for (let i = 0; i < newUnis.length; i += chunkSize) {
      const chunk = newUnis.slice(i, i + chunkSize);
      await prisma.university.createMany({ data: chunk });
      console.log(`Inserted chunk ${Math.floor(i / chunkSize) + 1} of ${Math.ceil(newUnis.length / chunkSize)}`);
    }
  } else {
    console.log('No new universities to insert. Database is up to date.');
  }

  console.log('✅ Universities seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
