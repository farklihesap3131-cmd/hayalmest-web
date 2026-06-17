import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const customers = await prisma.customer.findMany({
      include: {
        reservations: {
          select: {
            date: true,
            status: true,
            guestCount: true,
          },
          orderBy: { date: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const enrichedCustomers = customers.map(c => {
      const approvedReservations = c.reservations.filter(r => r.status === "APPROVED");
      const lastVisit = approvedReservations.length > 0 ? approvedReservations[0].date : (c.reservations.length > 0 ? c.reservations[0].date : null);
      
      return {
        id: c.id,
        name: c.name,
        phone: c.phone,
        optOut: c.optOut,
        reservationCount: c.reservations.length,
        approvedReservationCount: approvedReservations.length,
        lastVisit: lastVisit,
        createdAt: c.createdAt,
      };
    });

    return NextResponse.json(enrichedCustomers);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
