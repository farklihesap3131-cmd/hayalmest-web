const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Seeding started...");

  // Create Artists
  const artist1 = await prisma.artist.create({
    data: {
      name: "Hüseyin Turan",
      bio: "Türk halk müziği sanatçısı. Geleneksel türküleri kendine has yorumuyla günümüze taşıyor.",
      photoUrl: "/assets/images/bdf870_a1401b7cf6044c358c19292fdea2a50cf000.jpg",
    },
  });

  const artist2 = await prisma.artist.create({
    data: {
      name: "Zara",
      bio: "Güçlü sesi ve benzersiz yorumuyla Türk halk müziğinin efsanevi isimlerinden.",
      photoUrl: "/assets/images/bdf870_12ef2e747fa64270b2f6050aa0f3251df000.jpg",
    },
  });

  const artist3 = await prisma.artist.create({
    data: {
      name: "Ender Balkır",
      bio: "Anadolu'nun bağrından kopan türküleri duygu yüklü sesiyle harmanlayan usta sanatçı.",
      photoUrl: "/assets/images/bdf870_40f621e295184a64af2830762f3ae943f000.jpg",
    },
  });

  // Today
  const today = new Date();
  
  // Future Dates
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);
  
  const twoWeeks = new Date(today);
  twoWeeks.setDate(today.getDate() + 14);

  const nextMonth = new Date(today);
  nextMonth.setMonth(today.getMonth() + 1);

  // Past Dates
  const lastWeek = new Date(today);
  lastWeek.setDate(today.getDate() - 7);

  const lastMonth = new Date(today);
  lastMonth.setMonth(today.getMonth() - 1);

  // Create Events
  await prisma.event.createMany({
    data: [
      {
        title: "Hüseyin Turan ile Türkü Gecesi",
        description: "Muhteşem bir türkü şöleni sizi bekliyor.",
        date: nextWeek,
        artistId: artist1.id,
        posterUrl: "/assets/images/bdf870_00b6c80503924f918d317f9c4f137b68f000.jpg"
      },
      {
        title: "Zara Müzik Ziyafeti",
        description: "Zara'nın unutulmaz şarkılarıyla muazzam bir gece.",
        date: twoWeeks,
        artistId: artist2.id,
        posterUrl: "/assets/images/bdf870_27bf7cec6c0d4e35b34cc9cabb4d0fb1f000.jpg"
      },
      {
        title: "Ender Balkır Sahnesi",
        description: "Duygusal türkülerle unutulmaz anlar.",
        date: nextMonth,
        artistId: artist3.id,
        posterUrl: "/assets/images/bdf870_a623f653be8742638fbc44a1ace3e11c~mv2.jpg"
      },
      {
        title: "Hüseyin Turan Nostalji",
        description: "Geçmişten günümüze unutulmaz türküler.",
        date: lastWeek,
        artistId: artist1.id,
        posterUrl: "/assets/images/bdf870_313c1814971846f9bb0a114640849334f000.jpg"
      },
      {
        title: "Ender Balkır Türküleri",
        description: "Mest eden bir performans.",
        date: lastMonth,
        artistId: artist3.id,
        posterUrl: "/assets/images/bdf870_463d2616c67d44ea9a85cb10dfc15bdb~mv2.webp"
      }
    ]
  });

  console.log("Seeding finished successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
