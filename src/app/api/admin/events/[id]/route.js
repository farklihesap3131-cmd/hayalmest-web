import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PUT(request, { params }) {
  const { id } = await params;
  try {
    const body = await request.json();
    const data = {
      title: body.title,
      description: body.description,
      posterUrl: body.posterUrl,
      artistId: body.artistId,
    };
    if (body.date) {
      data.date = new Date(body.date);
    }
    const event = await prisma.event.update({
      where: { id },
      data,
      include: { artist: true },
    });
    return NextResponse.json(event);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  try {
    await prisma.event.delete({ where: { id } });
    return NextResponse.json({ message: "Event deleted" });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
