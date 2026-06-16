import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const body = await request.json();
    const table = await prisma.table.create({
      data: {
        name: body.name,
        x: body.x || 0,
        y: body.y || 0,
        shape: body.shape || "RECTANGLE",
        capacity: body.capacity || 4,
        roomId: parseInt(body.roomId),
      },
    });
    return NextResponse.json(table);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    // Batch update multiple tables positions
    if (Array.isArray(body)) {
      for (const t of body) {
        await prisma.table.update({
          where: { id: t.id },
          data: { x: t.x, y: t.y }
        });
      }
      return NextResponse.json({ message: "Positions updated" });
    }
    
    // Single table update
    const table = await prisma.table.update({
      where: { id: parseInt(body.id) },
      data: {
        name: body.name,
        shape: body.shape,
        capacity: body.capacity,
      }
    });
    return NextResponse.json(table);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
