import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PUT(request, { params }) {
  const { id } = await params;
  try {
    const body = await request.json();
    const artist = await prisma.artist.update({
      where: { id },
      data: {
        name: body.name,
        bio: body.bio,
        photoUrl: body.photoUrl,
      },
    });
    return NextResponse.json(artist);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  try {
    await prisma.artist.delete({ where: { id } });
    return NextResponse.json({ message: "Artist deleted" });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
