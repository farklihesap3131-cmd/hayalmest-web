import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const banners = await prisma.banner.findMany({
      orderBy: { id: "desc" },
    });
    return NextResponse.json(banners);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const banner = await prisma.banner.create({
      data: {
        title: body.title,
        content: body.content,
        imageUrl: body.imageUrl,
        isActive: body.isActive ?? true,
      },
    });
    return NextResponse.json(banner, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
