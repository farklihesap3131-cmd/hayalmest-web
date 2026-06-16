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
    const sendMessage = async (chatId, text) => {
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text }),
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

    // 2. Handle standard messages (to get Chat ID)
    if (body.message && body.message.chat && body.message.chat.id) {
      const chatId = body.message.chat.id;
      
      // Save Chat ID to DB
      await prisma.setting.upsert({
        where: { key: "telegram_chat_id" },
        update: { value: chatId.toString() },
        create: { key: "telegram_chat_id", value: chatId.toString() },
      });

      await sendMessage(chatId, "✅ HayalMest Rezervasyon Sistemi başarıyla bağlandı! Artık yeni rezervasyonlar buraya düşecek ve tek tıkla onaylayabileceksiniz.");
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
