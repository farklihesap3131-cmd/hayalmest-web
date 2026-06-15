import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const artists = await prisma.artist.findMany({
      include: { events: true },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(artists);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const artist = await prisma.artist.create({
      data: {
        name: body.name,
        bio: body.bio,
        photoUrl: body.photoUrl,
      },
    });
    return NextResponse.json(artist, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
