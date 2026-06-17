import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { askGroqWithContext } from "@/lib/groq";

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

    // 2. Handle standard messages (to get Chat ID and handle AI Chat)
    if (body.message && body.message.chat && body.message.chat.id) {
      const chatId = body.message.chat.id.toString();
      const text = body.message.text || "";
      
      // Check Privacy
      const existingChatIdSetting = await prisma.setting.findUnique({
        where: { key: "telegram_chat_id" }
      });

      if (!existingChatIdSetting || !existingChatIdSetting.value) {
        // First time setup: claim ownership
        await prisma.setting.upsert({
          where: { key: "telegram_chat_id" },
          update: { value: chatId },
          create: { key: "telegram_chat_id", value: chatId },
        });
        await sendMessage(chatId, "✅ Sistem Yöneticisi olarak kaydedildiniz. Bot artık sadece size hizmet verecek.");
      } else if (existingChatIdSetting.value !== chatId) {
        // Unauthorized user
        await sendMessage(chatId, "🚫 Bu özel bir işletme botudur. Yetkisiz erişim tespit edildi.");
        return NextResponse.json({ ok: true });
      }

      if (text === "/start") {
        await sendMessage(chatId, "✅ HayalMest Yapay Zeka Asistanı aktif!\n\nBana restoranla ilgili her şeyi sorabilirsiniz. Örn:\n- 'Bugün kaç boş masamız var?'\n- 'Tolga hangi masada oturuyor?'\n- 'Yarınki doluluk oranımız nedir?'");
        return NextResponse.json({ ok: true });
      }

      // Send a typing action to let user know AI is thinking
      await fetch(`https://api.telegram.org/bot${token}/sendChatAction`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, action: "typing" }),
      });

      // Pass the query to Groq AI
      const aiResponse = await askGroqWithContext(text);
      await sendMessage(chatId, aiResponse, "Markdown");
      
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
