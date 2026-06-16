import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function DELETE(request, { params }) {
  const { id } = await params;
  try {
    await prisma.table.delete({ where: { id: Number(id) } });
    return NextResponse.json({ message: "Table deleted" });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
