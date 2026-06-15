import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const reservations = await prisma.reservation.findMany({
      orderBy: { date: "desc" },
    });
    return NextResponse.json(reservations);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const reservation = await prisma.reservation.create({
      data: {
        name: body.name,
        phone: body.phone,
        date: new Date(body.date),
        guestCount: parseInt(body.guestCount),
        status: body.status || "PENDING",
        note: body.note,
      },
    });
    return NextResponse.json(reservation, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
