const { PrismaClient } = require('@prisma/client'); 
const prisma = new PrismaClient(); 

async function main() { 
  await prisma.setting.upsert({ 
    where: { key: 'telegram_bot_token' }, 
    update: { value: '8874354986:AAFiZ3pz69SKwGwRZVVb4T47mgTpeUGnOL4' }, 
    create: { key: 'telegram_bot_token', value: '8874354986:AAFiZ3pz69SKwGwRZVVb4T47mgTpeUGnOL4' }
  }); 
  console.log('Saved token'); 
} 

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
