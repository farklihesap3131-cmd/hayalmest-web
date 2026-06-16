import { prisma } from "@/lib/prisma";
import { DashboardClient } from "@/components/admin/DashboardClient";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 1. Fetch Stats
  const [totalEvents, totalArtists, pendingResCount, totalResCount, galleryCount, menuCatsCount] = await Promise.all([
    prisma.event.count(),
    prisma.artist.count(),
    prisma.reservation.count({ where: { status: "PENDING" } }),
    prisma.reservation.count(),
    prisma.memory.count(),
    prisma.menuCategory.count(),
  ]);

  const stats = {
    events: totalEvents,
    artists: totalArtists,
    pendingRes: pendingResCount,
    totalRes: totalResCount,
    gallery: galleryCount,
    menuCats: menuCatsCount,
  };

  // 2. Fetch Upcoming Events (Next 5)
  const upcomingEvents = await prisma.event.findMany({
    where: { date: { gte: today } },
    orderBy: { date: "asc" },
    take: 5,
    include: { artist: true },
  });

  // 3. Fetch Recent Pending Reservations (Last 5)
  const pendingReservations = await prisma.reservation.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  // 4. Fetch Future Reservations to calculate density
  const futureReservations = await prisma.reservation.findMany({
    where: { date: { gte: today }, status: { in: ["PENDING", "APPROVED"] } },
    select: { date: true, guestCount: true },
  });

  // Calculate density (guests per day)
  const densityMap = {};
  futureReservations.forEach(res => {
    const dateStr = new Date(res.date).toISOString().split("T")[0];
    if (!densityMap[dateStr]) densityMap[dateStr] = 0;
    densityMap[dateStr] += res.guestCount;
  });

  const density = Object.keys(densityMap)
    .sort() // Sort by date
    .map(date => ({ date, count: densityMap[date] }))
    .slice(0, 7); // Show next 7 active days

  return (
    <DashboardClient 
      stats={stats} 
      upcomingEvents={upcomingEvents} 
      pendingReservations={pendingReservations} 
      density={density} 
    />
  );
}
