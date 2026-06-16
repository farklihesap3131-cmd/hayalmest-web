import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function DELETE(request, { params }) {
  const { id } = await params;
  try {
    await prisma.room.delete({ where: { id: Number(id) } });
    return NextResponse.json({ message: "Room deleted" });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
