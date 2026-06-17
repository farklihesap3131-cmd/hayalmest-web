import { prisma } from "@/lib/prisma";

export async function askGroqWithContext(query) {
  // 1. Get Groq API Key
  const apiKeySetting = await prisma.setting.findUnique({
    where: { key: "groq_api_key" }
  });

  if (!apiKeySetting || !apiKeySetting.value) {
    return "❌ Groq API anahtarı sistemde bulunamadı. Lütfen ayarlardan ekleyin.";
  }
  const groqApiKey = apiKeySetting.value;

  // 2. Fetch Context Data
  const rooms = await prisma.room.findMany({
    include: { tables: true }
  });

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  const reservations = await prisma.reservation.findMany({
    where: {
      date: {
        gte: todayStart,
      }
    },
    include: {
      tables: {
        include: { room: true }
      }
    },
    orderBy: { date: 'asc' }
  });

  // Calculate capacities
  let totalCapacity = 0;
  let contextText = "--- MEKAN DURUMU ---\n";
  
  rooms.forEach(room => {
    let roomCap = 0;
    room.tables.forEach(t => roomCap += t.capacity);
    totalCapacity += roomCap;
    contextText += `${room.name} (${roomCap} Kişi Kapasiteli) - ${room.tables.length} Masa\n`;
  });

  contextText += `\nToplam Mekan Kapasitesi: ${totalCapacity} Kişi\n\n`;
  contextText += "--- REZERVASYONLAR (Bugün ve Sonrası) ---\n";

  if (reservations.length === 0) {
    contextText += "Şu an için hiç rezervasyon bulunmuyor.\n";
  } else {
    reservations.forEach(res => {
      const dateStr = new Date(res.date).toLocaleDateString("tr-TR");
      const status = res.status === "APPROVED" ? "Onaylı" : res.status === "PENDING" ? "Bekliyor" : "İptal";
      const tables = res.tables && res.tables.length > 0 
        ? res.tables.map(t => `${t.room.name} -> ${t.name}`).join(", ") 
        : "Atanmadı";
      
      contextText += `- [${status}] ${dateStr} | ${res.name} | ${res.guestCount} Kişi | Masalar: ${tables} | Not: ${res.note || "Yok"} | Tel: ${res.phone || "Yok"}\n`;
    });
  }

  // 3. Build System Prompt
  const systemPrompt = `Sen HayalMest restoranının profesyonel, kibar ve çözüm odaklı yapay zeka asistanısın.
Görevlerin:
1. Restoran yöneticisine (patrona) gelen soruları, elindeki GÜNCEL VERİLERE bakarak net bir şekilde cevaplamak.
2. Sadece elindeki verilere dayanarak konuş. Verilerde olmayan bir şey sorulursa "Bu bilgiye şu an erişemiyorum" de.
3. Yanıtlarını Telegram/Web üzerinden kolay okunacak şekilde (gerekirse madde imleri ve emojiler kullanarak) kısa ve öz tut. Gereksiz laf kalabalığı yapma.

GÜNCEL VERİLER:
Tarih/Saat: ${now.toLocaleString("tr-TR")}
${contextText}
`;

  // 4. Call Groq API
  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${groqApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama3-70b-8192", // Fast and good for Turkish
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: query }
        ],
        temperature: 0.3,
        max_tokens: 1024
      })
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Groq Error:", err);
      return "⚠️ Groq servisi şu anda yanıt vermiyor veya API limitine takıldı.";
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("Groq Request Failed:", error);
    return "⚠️ Groq bağlantısında bir hata oluştu.";
  }
}
