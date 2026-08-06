const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  const dataPath = path.join(__dirname, '../src/docs/master/accredations.json');
  console.log(`Reading data from: ${dataPath}`);
  
  // Strip BOM if present
  let rawData = fs.readFileSync(dataPath, 'utf-8').replace(/^\uFEFF/, '');
  const accreditations = JSON.parse(rawData);

  console.log(`Starting to seed ${accreditations.length} accreditations...`);

  for (const acc of accreditations) {
    await prisma.accreditation.upsert({
      where: { name: acc.name },
      update: {
        abbreviation: acc.abbreviation,
        url: acc.url
      },
      create: {
        name: acc.name,
        abbreviation: acc.abbreviation,
        url: acc.url
      },
    });
  }

  console.log('✅ Accreditations seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
