import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PUT(request, { params }) {
  const { id } = await params;
  try {
    const body = await request.json();
    const memory = await prisma.memory.update({
      where: { id },
      data: {
        type: body.type,
        url: body.url,
        caption: body.caption,
        ...(body.showOnHome !== undefined && { showOnHome: body.showOnHome }),
      },
    });
    return NextResponse.json(memory);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  try {
    await prisma.memory.delete({ where: { id } });
    return NextResponse.json({ message: "Memory deleted" });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
