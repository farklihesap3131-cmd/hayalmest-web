import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rooms = await prisma.room.findMany({
      include: {
        tables: true
      },
      orderBy: { createdAt: "asc" }
    });
    return NextResponse.json(rooms);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const room = await prisma.room.create({
      data: {
        name: body.name,
        width: body.width || 800,
        height: body.height || 600,
      },
    });
    return NextResponse.json(room);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
