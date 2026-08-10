import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
  const users = await prisma.user.findMany();
  console.log(users);
  process.exit(0);
}
run();
