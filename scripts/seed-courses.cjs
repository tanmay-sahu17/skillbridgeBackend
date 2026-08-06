const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  const dataPath = path.join(__dirname, '../src/docs/master/course-branch.json');
  console.log(`Reading data from: ${dataPath}`);
  
  // Strip BOM if present
  let rawData = fs.readFileSync(dataPath, 'utf-8').replace(/^\uFEFF/, '');
  const data = JSON.parse(rawData);

  console.log('--- Seeding Major Branch Guide (Categories) ---');
  for (const categoryData of data.major_branch_guide) {
    const programs = categoryData.programs.map(prog => ({
      name: prog.name,
      fullName: prog.full_name || null,
      branches: prog.branches || [],
      branchGroups: (prog.branch_groups || []).map(bg => ({
        name: bg.name,
        specializations: bg.specializations || []
      }))
    }));

    await prisma.courseCategory.upsert({
      where: { name: categoryData.category },
      update: { programs },
      create: {
        name: categoryData.category,
        programs
      }
    });
    console.log(`Upserted category: ${categoryData.category}`);
  }

  console.log('\n--- Seeding Extracted Course List ---');
  for (const typeData of data.extracted_course_list) {
    const institutionType = typeData.institution_type;
    
    for (const courseData of typeData.courses) {
      await prisma.course.upsert({
        where: { name: courseData.name },
        update: {
          description: courseData.description || null,
          institutionType
        },
        create: {
          name: courseData.name,
          description: courseData.description || null,
          institutionType
        }
      });
    }
  }

  console.log('\n✅ Course and Branch seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
