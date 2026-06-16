import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const reservations = await prisma.reservation.findMany({
      orderBy: { date: "desc" },
    });
    return NextResponse.json(reservations);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const reservation = await prisma.reservation.create({
      data: {
        name: body.name,
        phone: body.phone,
        date: new Date(body.date),
        guestCount: parseInt(body.guestCount),
        status: body.status || "PENDING",
        note: body.note,
      },
    });
    // ── TELEGRAM NOTIFICATION ──
    try {
      const tokenSetting = await prisma.setting.findUnique({ where: { key: "telegram_bot_token" }});
      const chatSetting = await prisma.setting.findUnique({ where: { key: "telegram_chat_id" }});
      
      if (tokenSetting?.value && chatSetting?.value) {
        const token = tokenSetting.value;
        const chatId = chatSetting.value;
        
        const messageText = `🛎 *YENİ REZERVASYON*\n\n👤 *İsim:* ${reservation.name}\n📞 *Telefon:* ${reservation.phone}\n📅 *Tarih:* ${new Date(reservation.date).toLocaleString('tr-TR')}\n👥 *Kişi Sayısı:* ${reservation.guestCount}\n📝 *Not:* ${reservation.note || "-"}`;
        
        const inlineKeyboard = {
          inline_keyboard: [
            [
              { text: "✅ ONAYLA", callback_data: `approve_${reservation.id}` },
              { text: "❌ REDDET", callback_data: `reject_${reservation.id}` }
            ]
          ]
        };

        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: messageText,
            parse_mode: "Markdown",
            reply_markup: inlineKeyboard
          })
        });
      }
    } catch (tgError) {
      console.error("Telegram notification failed:", tgError);
    }
    // ───────────────────────────

    return NextResponse.json(reservation, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
