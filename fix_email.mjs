import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
  await prisma.user.update({
    where: { id: 'cmsng0kc60000ky04fnyv65vw' },
    data: { email: 'saadalfhaid@gmail.com' }
  });
  console.log("Fixed email to lowercase");
  process.exit(0);
}
run();
