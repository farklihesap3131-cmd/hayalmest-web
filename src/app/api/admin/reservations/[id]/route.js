import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PUT(request, { params }) {
  const { id } = await params;
  try {
    const body = await request.json();
    const data = {};
    
    if (body.name !== undefined) data.name = body.name;
    if (body.phone !== undefined) data.phone = body.phone;
    if (body.status !== undefined) data.status = body.status;
    if (body.note !== undefined) data.note = body.note;
    if (body.date !== undefined) data.date = new Date(body.date);
    if (body.guestCount !== undefined) data.guestCount = parseInt(body.guestCount);
    
    // Many-to-Many assignment
    if (body.tableIds !== undefined) {
      if (body.tableIds === null || body.tableIds.length === 0) {
        data.tables = { set: [] }; // Disconnect all
      } else {
        data.tables = {
          set: body.tableIds.map(id => ({ id: parseInt(id) }))
        };
      }
    }

    const reservation = await prisma.reservation.update({
      where: { id: Number(id) },
      data,
    });
    return NextResponse.json(reservation);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  try {
    await prisma.reservation.delete({ where: { id: Number(id) } });
    return NextResponse.json({ message: "Reservation deleted" });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
