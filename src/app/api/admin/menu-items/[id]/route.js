import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PUT(request, { params }) {
  const { id } = await params;
  try {
    const body = await request.json();
    const data = {};
    if (body.name !== undefined) data.name = body.name;
    if (body.description !== undefined) data.description = body.description;
    if (body.categoryId !== undefined) data.categoryId = body.categoryId;
    if (body.price !== undefined) data.price = parseFloat(body.price);
    if (body.imageUrl !== undefined) data.imageUrl = body.imageUrl;

    const menuItem = await prisma.menuItem.update({
      where: { id },
      data,
      include: { category: true },
    });
    return NextResponse.json(menuItem);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  try {
    await prisma.menuItem.delete({ where: { id } });
    return NextResponse.json({ message: "Menu item deleted" });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
