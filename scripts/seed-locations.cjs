const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  const dataPath = path.join(__dirname, '../src/docs/master/state-district-city.json');
  console.log(`Reading data from: ${dataPath}`);
  
  const rawData = fs.readFileSync(dataPath, 'utf-8').replace(/^\uFEFF/, '');
  const countryData = JSON.parse(rawData);

  console.log(`Starting to seed data for ${countryData.name}...`);

  for (const stateData of countryData.states) {
    console.log(`Processing State: ${stateData.name} ...`);
    
    // Upsert state
    const state = await prisma.state.upsert({
      where: { name: stateData.name },
      update: {},
      create: {
        name: stateData.name,
      },
    });

    for (const districtData of stateData.districts) {
      // Upsert district
      const district = await prisma.district.upsert({
        where: {
          name_stateId: {
            name: districtData.name,
            stateId: state.id,
          }
        },
        update: {},
        create: {
          name: districtData.name,
          stateId: state.id,
        },
      });

      // Prepare and bulk insert new cities to save time
      const existingCities = await prisma.city.findMany({
        where: { districtId: district.id },
        select: { name: true, pincode: true }
      });
      
      const existingCityKeys = new Set(existingCities.map(c => `${c.name}-${c.pincode}`));

      const newCities = districtData.cities
        .filter(c => !existingCityKeys.has(`${c.name}-${c.pincode}`))
        .map(c => ({
          name: c.name,
          pincode: c.pincode,
          districtId: district.id,
        }));

      if (newCities.length > 0) {
        await prisma.city.createMany({
          data: newCities,
        });
      }
    }
  }

  console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
