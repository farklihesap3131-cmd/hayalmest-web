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
      
      // Admin Auth Flow
      let adminIds = [];
      const adminSetting = await prisma.setting.findUnique({
        where: { key: "telegram_chat_id" }
      });

      if (adminSetting && adminSetting.value) {
        try {
          adminIds = JSON.parse(adminSetting.value);
        } catch (e) {
          // Backward compatibility for old single string ID
          adminIds = [adminSetting.value];
          await prisma.setting.update({
            where: { key: "telegram_chat_id" },
            data: { value: JSON.stringify(adminIds) }
          });
        }
      }

      if (adminIds.length === 0) {
        // First time setup: claim ownership
        adminIds = [chatId];
        await prisma.setting.upsert({
          where: { key: "telegram_chat_id" },
          update: { value: JSON.stringify(adminIds) },
          create: { key: "telegram_chat_id", value: JSON.stringify(adminIds) },
        });
        await sendMessage(chatId, "✅ Sistem Yöneticisi olarak kaydedildiniz. Bot artık ilk size hizmet verecek.");
      } else if (!adminIds.includes(chatId)) {
        // Unauthorized user requesting access
        const userName = body.message.chat.first_name || "Bilinmiyor";
        const lastName = body.message.chat.last_name || "";
        const fullName = `${userName} ${lastName}`.trim();
        
        await sendMessage(chatId, "🚫 Yetkisiz erişim. Sistem yöneticisine giriş talebiniz iletildi. Lütfen onay bekleyin.");
        
        // Notify Super Admin (first admin in array)
        const superAdminId = adminIds[0];
        const payload = {
          chat_id: superAdminId,
          text: `🔔 *Yeni Erişim Talebi*\n\nAdı: ${fullName}\nID: ${chatId}\n\nBu kullanıcının sistemi kullanmasına izin veriyor musunuz?`,
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [
                { text: "✅ Onayla", callback_data: `approve_admin_${chatId}` },
                { text: "❌ Reddet", callback_data: `reject_admin_${chatId}` }
              ]
            ]
          }
        };
        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        return NextResponse.json({ ok: true });
      }

      if (text === "/start") {
        await sendMessage(chatId, "✅ HayalMest Yapay Zeka Asistanı aktif!\n\nBana restoranla ilgili her şeyi sorabilirsiniz. Örn:\n- 'Bugün kaç boş masamız var?'\n- 'Tolga hangi masada oturuyor?'\n- 'Yarınki doluluk oranımız nedir?'");
        return NextResponse.json({ ok: true });
      }

      // HYBRID SYSTEM: First try to find a quick reservation match if it's a short query
      let searchStr = text.toLowerCase("tr-TR");
      const ignoreWords = ["hangi", "masaya", "rezerve", "nerede", "masası", "masa", "nedir", "kim", "nerde", "oturuyor", "var mı"];
      ignoreWords.forEach(w => {
        searchStr = searchStr.replace(new RegExp(`\\b${w}\\b`, 'gi'), '');
      });
      searchStr = searchStr.replace(/[?!.]/g, '').trim();

      const wordCount = text.split(" ").length;

      if (wordCount <= 4 && searchStr.length > 2) {
        const results = await prisma.reservation.findMany({
          where: { name: { contains: searchStr, mode: 'insensitive' } },
          include: { tables: { include: { room: true } } },
          orderBy: { date: 'desc' },
          take: 3
        });

        if (results.length > 0) {
          let reply = `⚡ *Hızlı Arama Sonucu:*\n\n`;
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
          return NextResponse.json({ ok: true });
        }
      }

      // If no exact match or it's a longer question, fallback to Groq AI
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

      if (data.startsWith("approve_admin_")) {
        const newAdminId = data.replace("approve_admin_", "");
        const adminSetting = await prisma.setting.findUnique({ where: { key: "telegram_chat_id" } });
        let adminIds = [];
        if (adminSetting && adminSetting.value) {
          try { adminIds = JSON.parse(adminSetting.value); } 
          catch(e) { adminIds = [adminSetting.value]; }
        }
        if (!adminIds.includes(newAdminId)) {
          adminIds.push(newAdminId);
          await prisma.setting.update({
            where: { key: "telegram_chat_id" },
            data: { value: JSON.stringify(adminIds) }
          });
        }
        await editMessageText(chatId, messageId, `${callbackQuery.message.text}\n\n✅ KULLANICI ONAYLANDI (${new Date().toLocaleString('tr-TR')})`);
        await sendMessage(newAdminId, "🎉 Erişim talebiniz yönetici tarafından onaylandı! Botu kullanmaya başlayabilirsiniz. /start yazarak menüyü görebilirsiniz.");

      } else if (data.startsWith("reject_admin_")) {
        const newAdminId = data.replace("reject_admin_", "");
        await editMessageText(chatId, messageId, `${callbackQuery.message.text}\n\n❌ KULLANICI REDDEDİLDİ (${new Date().toLocaleString('tr-TR')})`);
        await sendMessage(newAdminId, "❌ Erişim talebiniz yönetici tarafından reddedildi.");

      } else if (data.startsWith("approve_")) {
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
