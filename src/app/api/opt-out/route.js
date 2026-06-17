import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { phone } = await request.json();
    
    if (!phone) {
      return NextResponse.json({ error: "Telefon numarası eksik" }, { status: 400 });
    }

    // Attempt to find by phone
    let cleanPhone = phone.replace(/\s+/g, '');
    
    // In case the user enters with a leading 0, +90 etc., we might need a looser match.
    // For simplicity, we assume exact match or partial match logic if needed later.
    
    const customer = await prisma.customer.findFirst({
      where: { phone: { contains: cleanPhone.slice(-10) } } // match last 10 digits
    });

    if (!customer) {
      return NextResponse.json({ error: "Bu numara sistemimizde bulunamadı." }, { status: 404 });
    }

    await prisma.customer.update({
      where: { id: customer.id },
      data: { optOut: true }
    });

    return NextResponse.json({ success: true, message: "Başarıyla abonelikten çıktınız." });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
