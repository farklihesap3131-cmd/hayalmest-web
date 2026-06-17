import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json();

    // 1. Get the bot token from settings
    const tokenSetting = await prisma.setting.findUnique({
      where: { key: "telegram_bot_token" },
    });
    
    if (!tokenSetting || !tokenSetting.value) {
      return NextResponse.json({ error: "No token configured" }, { status: 400 });
    }
    const token = tokenSetting.value;

    // Helper to send message
    const sendMessage = async (chatId, text, parseMode = null) => {
      const payload = { chat_id: chatId, text };
      if (parseMode) payload.parse_mode = parseMode;
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    };

    // Helper to edit message
    const editMessageText = async (chatId, messageId, text) => {
      await fetch(`https://api.telegram.org/bot${token}/editMessageText`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, message_id: messageId, text }),
      });
    };

    // 2. Handle standard messages (to get Chat ID and handle Search)
    if (body.message && body.message.chat && body.message.chat.id) {
      const chatId = body.message.chat.id;
      const text = body.message.text || "";
      
      // Save Chat ID to DB
      await prisma.setting.upsert({
        where: { key: "telegram_chat_id" },
        update: { value: chatId.toString() },
        create: { key: "telegram_chat_id", value: chatId.toString() },
      });

      if (text === "/start") {
        await sendMessage(chatId, "✅ HayalMest Rezervasyon Sistemi başarıyla bağlandı! Artık yeni rezervasyonlar buraya düşecek ve tek tıkla onaylayabileceksiniz.\n\nAyrıca bir müşterinin masasını öğrenmek için sadece ismini (örn: Tolga Kabadayı) yazabilirsiniz.");
        return NextResponse.json({ ok: true });
      }

      // It's a text message, use it to search reservations
      let searchStr = text.toLowerCase("tr-TR");
      // Remove common words that are not part of the name
      const ignoreWords = ["hangi", "masaya", "rezerve", "nerede", "masası", "masa", "nedir", "kim", "nerde", "oturuyor", "var mı"];
      ignoreWords.forEach(w => {
        searchStr = searchStr.replace(new RegExp(`\\b${w}\\b`, 'gi'), '');
      });
      searchStr = searchStr.replace(/[?!.]/g, '').trim();

      if (searchStr.length > 2) {
        // Search reservations by name
        const results = await prisma.reservation.findMany({
          where: {
            name: {
              contains: searchStr,
              mode: 'insensitive',
            }
          },
          include: {
            tables: {
              include: {
                room: true
              }
            }
          },
          orderBy: {
            date: 'desc'
          },
          take: 5
        });

        if (results.length > 0) {
          let reply = `🔍 *Arama Sonuçları:*\n\n`;
          results.forEach(res => {
            const dateStr = res.date ? new Date(res.date).toLocaleDateString("tr-TR") : "Tarih Yok";
            reply += `👤 *${res.name}* (${dateStr}) - ${res.guestCount} Kişi\n`;
            if (res.tables && res.tables.length > 0) {
              const tableNames = res.tables.map(t => `${t.room.name} -> ${t.name}`).join(", ");
              reply += `🪑 Masalar: ${tableNames}\n`;
            } else {
              reply += `🪑 Masa: Henüz masa atanmamış.\n`;
            }
            reply += `\n`;
          });
          await sendMessage(chatId, reply, "Markdown");
        } else {
          await sendMessage(chatId, `⚠️ "${searchStr}" ismiyle eşleşen bir rezervasyon bulunamadı.`);
        }
      }
      
      return NextResponse.json({ ok: true });
    }

    // 3. Handle Callback Queries (Button Clicks)
    if (body.callback_query && body.callback_query.data) {
      const callbackQuery = body.callback_query;
      const data = callbackQuery.data; // "approve_ID" or "reject_ID"
      const chatId = callbackQuery.message.chat.id;
      const messageId = callbackQuery.message.message_id;

      if (data.startsWith("approve_")) {
        const resId = data.replace("approve_", "");
        await prisma.reservation.update({
          where: { id: resId },
          data: { status: "APPROVED" },
        });
        await editMessageText(chatId, messageId, `${callbackQuery.message.text}\n\n✅ ONAYLANDI (${new Date().toLocaleString('tr-TR')})`);
        
        // WhatsApp link generating for user communication
        const res = await prisma.reservation.findUnique({ where: { id: resId }});
        if (res) {
           await sendMessage(chatId, `Müşteriye WhatsApp'tan yazmak için tıklayın:\nhttps://wa.me/${res.phone.replace(/[^0-9]/g, '')}?text=Merhaba%20${encodeURIComponent(res.name)},%20HayalMest%20rezervasyonunuz%20onaylanmıştır.`);
        }

      } else if (data.startsWith("reject_")) {
        const resId = data.replace("reject_", "");
        await prisma.reservation.update({
          where: { id: resId },
          data: { status: "REJECTED" },
        });
        await editMessageText(chatId, messageId, `${callbackQuery.message.text}\n\n❌ REDDEDİLDİ (${new Date().toLocaleString('tr-TR')})`);
      }

      // Tell Telegram the callback query was received so the loading spinner stops
      await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callback_query_id: callbackQuery.id }),
      });

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Telegram Webhook Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
