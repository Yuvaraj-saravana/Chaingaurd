const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const SEED_USERS = [
  {
    username: 'setter1',
    email: 'setter1@university.edu',
    password: 'Setter@123',
    role: 'SETTER',
    fullName: 'Dr. Ramesh Kumar',
    department: 'Department of Computer & Communication Engineering'
  },
  {
    username: 'reviewer1',
    email: 'reviewer1@university.edu',
    password: 'Reviewer@123',
    role: 'REVIEWER',
    fullName: 'Prof. Ananya Sen',
    department: 'Examination Review Board - CCE'
  },
  {
    username: 'controller1',
    email: 'controller1@university.edu',
    password: 'Controller@123',
    role: 'CONTROLLER',
    fullName: 'Dr. K. S. Murthy',
    department: 'Office of the Controller of Examinations'
  },
  {
    username: 'invigilator1',
    email: 'invigilator1@university.edu',
    password: 'Invigilator@123',
    role: 'INVIGILATOR',
    fullName: 'Prof. Suresh Nair',
    department: 'Exam Centre Alpha - Hall 304'
  },
  {
    username: 'admin1',
    email: 'admin1@university.edu',
    password: 'Admin@123',
    role: 'ADMIN',
    fullName: 'Chief IT Security Admin',
    department: 'Cybersecurity & Infrastructure Division'
  }
];

async function main() {
  console.log('🌱 Starting CHAINGUARD User Seeding...');

  for (const user of SEED_USERS) {
    const passwordHash = await bcrypt.hash(user.password, 12);

    const upsertedUser = await prisma.user.upsert({
      where: { username: user.username },
      update: {
        email: user.email,
        passwordHash,
        role: user.role,
        fullName: user.fullName,
        department: user.department,
        isActive: true,
        failedLogins: 0
      },
      create: {
        username: user.username,
        email: user.email,
        passwordHash,
        role: user.role,
        fullName: user.fullName,
        department: user.department,
        isActive: true,
        failedLogins: 0
      }
    });

    console.log(`✅ Seeded User: [${upsertedUser.role}] ${upsertedUser.username} (${upsertedUser.fullName})`);
  }

  console.log('🎉 Seeding completed successfully! 5 verified accounts are ready.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
