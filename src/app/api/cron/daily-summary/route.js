import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    // 1. Check if token & chat id exists
    const tokenSetting = await prisma.setting.findUnique({ where: { key: "telegram_bot_token" } });
    const chatIdSetting = await prisma.setting.findUnique({ where: { key: "telegram_chat_id" } });
    
    if (!tokenSetting?.value || !chatIdSetting?.value) {
      return NextResponse.json({ error: "Telegram not configured" }, { status: 400 });
    }

    const token = tokenSetting.value;
    const chatId = chatIdSetting.value;

    // 2. Fetch all tables to calculate total capacity
    const tables = await prisma.table.findMany();
    const totalCapacity = tables.reduce((sum, t) => sum + t.capacity, 0);

    // 3. Fetch today's reservations
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const reservations = await prisma.reservation.findMany({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay
        },
        status: "APPROVED"
      }
    });

    const totalGuests = reservations.reduce((sum, r) => sum + r.guestCount, 0);
    const occupancyRate = totalCapacity > 0 ? Math.round((totalGuests / totalCapacity) * 100) : 0;

    // 4. Format Message
    const text = `📊 *Günlük Özet - HayalMest*
📅 Tarih: ${now.toLocaleDateString("tr-TR")}

👥 *Bugünkü Rezervasyonlar*
• Onaylanmış Rezervasyon Sayısı: ${reservations.length}
• Toplam Misafir Sayısı: ${totalGuests}
• Mekan Kapasitesi: ${totalCapacity}

📈 *Doluluk Oranı:* %${occupancyRate}

İyi akşamlar ve bol kazançlar dileriz! 🥂`;

    // 5. Send message
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        chat_id: chatId, 
        text: text,
        parse_mode: "Markdown"
      }),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Cron Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
