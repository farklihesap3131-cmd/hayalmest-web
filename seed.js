const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Seeding started...");

  // Clear existing data
  await prisma.event.deleteMany({});
  await prisma.artist.deleteMany({});

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

  const artist4 = await prisma.artist.create({
    data: {
      name: "Volkan Konak",
      bio: "Kuzeyin oğlu olarak bilinen sanatçı, Karadeniz müziğine yön veren isimlerin başında geliyor.",
      photoUrl: "/assets/images/bdf870_0b8e843db66a448c9097e2c12257b4e9f000.jpg",
    },
  });

  const artist5 = await prisma.artist.create({
    data: {
      name: "Şevval Sam",
      bio: "Hem oyunculuğu hem de büyüleyici sesiyle her tarza hayat veren çok yönlü sanatçı.",
      photoUrl: "/assets/images/bdf870_190a8c41a61640c78bac9966219eb2f5f000.jpg",
    },
  });

  const artist6 = await prisma.artist.create({
    data: {
      name: "Cengiz Özkan",
      bio: "Bağlamasıyla halk müziğine gönül verenlerin başucu sanatçılarından.",
      photoUrl: "/assets/images/bdf870_27bf7cec6c0d4e35b34cc9cabb4d0fb1f000.jpg",
    },
  });

  const artist7 = await prisma.artist.create({
    data: {
      name: "Musa Eroğlu",
      bio: "Bozkırın tezenesi ekolünü devam ettiren, türkülerin unutulmaz ustası.",
      photoUrl: "/assets/images/bdf870_2a0fccce5d364550a0029a31156fdfd2f000.jpg",
    },
  });

  // Dates
  const today = new Date();
  
  // Future Dates
  const t_plus_1_week = new Date(today); t_plus_1_week.setDate(today.getDate() + 7);
  const t_plus_2_weeks = new Date(today); t_plus_2_weeks.setDate(today.getDate() + 14);
  const t_plus_3_weeks = new Date(today); t_plus_3_weeks.setDate(today.getDate() + 21);
  const t_plus_1_month = new Date(today); t_plus_1_month.setMonth(today.getMonth() + 1);
  const t_plus_2_months = new Date(today); t_plus_2_months.setMonth(today.getMonth() + 2);

  // Past Dates
  const t_minus_1_week = new Date(today); t_minus_1_week.setDate(today.getDate() - 7);
  const t_minus_3_weeks = new Date(today); t_minus_3_weeks.setDate(today.getDate() - 21);
  const t_minus_1_month = new Date(today); t_minus_1_month.setMonth(today.getMonth() - 1);
  const t_minus_1_5_months = new Date(today); t_minus_1_5_months.setDate(today.getDate() - 45);
  const t_minus_2_months = new Date(today); t_minus_2_months.setMonth(today.getMonth() - 2);

  // Create Events
  await prisma.event.createMany({
    data: [
      // --- PAST EVENTS ---
      {
        title: "Volkan Konak Rüzgarı",
        description: "Karadeniz'in hırçın sesiyle unutulmaz bir gece.",
        date: t_minus_2_months,
        artistId: artist4.id,
        posterUrl: "/assets/images/bdf870_00b6c80503924f918d317f9c4f137b68f000.jpg"
      },
      {
        title: "Şevval Sam Özel Gecesi",
        description: "Duygu dolu şarkılar ve eşsiz bir yorum.",
        date: t_minus_1_5_months,
        artistId: artist5.id,
        posterUrl: "/assets/images/bdf870_07964af4d4454886afb50bcb5ca753a0~mv2.jpg"
      },
      {
        title: "Ender Balkır Türküleri",
        description: "Mest eden bir performans.",
        date: t_minus_1_month,
        artistId: artist3.id,
        posterUrl: "/assets/images/bdf870_463d2616c67d44ea9a85cb10dfc15bdb~mv2.webp"
      },
      {
        title: "Cengiz Özkan ile Bağlama Ziyafeti",
        description: "Tellerin dile geldiği anlar.",
        date: t_minus_3_weeks,
        artistId: artist6.id,
        posterUrl: "/assets/images/bdf870_13b1f486d64741079df113ef7b615044~mv2.avif"
      },
      {
        title: "Hüseyin Turan Nostalji",
        description: "Geçmişten günümüze unutulmaz türküler.",
        date: t_minus_1_week,
        artistId: artist1.id,
        posterUrl: "/assets/images/bdf870_313c1814971846f9bb0a114640849334f000.jpg"
      },

      // --- FUTURE EVENTS ---
      {
        title: "Zara Müzik Ziyafeti",
        description: "Zara'nın unutulmaz şarkılarıyla muazzam bir gece.",
        date: t_plus_1_week,
        artistId: artist2.id,
        posterUrl: "/assets/images/bdf870_16431d4957f848058574a2cc3f6860be~mv2.webp"
      },
      {
        title: "Ender Balkır Sahnesi",
        description: "Duygusal türkülerle unutulmaz anlar.",
        date: t_plus_2_weeks,
        artistId: artist3.id,
        posterUrl: "/assets/images/bdf870_a623f653be8742638fbc44a1ace3e11c~mv2.jpg"
      },
      {
        title: "Musa Eroğlu Türkü Şöleni",
        description: "Ustanın dilinden dökülen nağmeler.",
        date: t_plus_3_weeks,
        artistId: artist7.id,
        posterUrl: "/assets/images/bdf870_2407a94d5aab40bbb6bf364d01ef66cc~mv2.png"
      },
      {
        title: "Hüseyin Turan ile Türkü Gecesi",
        description: "Muhteşem bir türkü şöleni sizi bekliyor.",
        date: t_plus_1_month,
        artistId: artist1.id,
        posterUrl: "/assets/images/bdf870_2acff29e15614097944c83e9845b2781f000.jpg"
      },
      {
        title: "Şevval Sam Performansı",
        description: "Müziğin ritmine kapılacağınız büyüleyici gece.",
        date: t_plus_2_months,
        artistId: artist5.id,
        posterUrl: "/assets/images/bdf870_34c932394d7e4fb88a2d6da08bd09157f001.jpg"
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
