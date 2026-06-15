import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const memories = await prisma.memory.findMany({
      orderBy: { id: "desc" },
    });
    return NextResponse.json(memories);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const memory = await prisma.memory.create({
      data: {
        type: body.type,
        url: body.url,
        caption: body.caption,
      },
    });
    return NextResponse.json(memory, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
