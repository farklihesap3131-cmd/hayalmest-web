import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date");
    
    if (!dateParam) {
      return NextResponse.json({ error: "Date is required" }, { status: 400 });
    }

    // Parse date and create start/end of day to query
    const targetDate = new Date(dateParam);
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    const reservations = await prisma.reservation.findMany({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay
        },
        status: "APPROVED" // We only care about approved reservations for table mapping
      },
      orderBy: { createdAt: "asc" }
    });
    
    return NextResponse.json(reservations);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
