const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const reservations = await prisma.reservation.findMany({
    orderBy: { createdAt: 'asc' }
  });

  console.log(`Found ${reservations.length} reservations. Syncing customers...`);

  for (const res of reservations) {
    if (!res.phone) continue;

    // clean phone (basic cleaning, e.g., strip spaces)
    const cleanPhone = res.phone.replace(/\s+/g, '');

    // check if customer exists
    let customer = await prisma.customer.findUnique({
      where: { phone: cleanPhone }
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          name: res.name,
          phone: cleanPhone,
        }
      });
      console.log(`Created customer: ${customer.name} (${customer.phone})`);
    }

    // Link reservation to customer if not already linked
    if (res.customerId !== customer.id) {
      await prisma.reservation.update({
        where: { id: res.id },
        data: { customerId: customer.id }
      });
    }
  }

  console.log("Sync complete!");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
