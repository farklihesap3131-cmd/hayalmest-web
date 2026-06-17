import { prisma } from "@/lib/prisma";

// Define the tools (functions) available to the AI
const tools = [
  {
    type: "function",
    function: {
      name: "create_reservation",
      description: "Yeni bir rezervasyon oluşturur.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Müşteri adı ve soyadı." },
          phone: { type: "string", description: "Müşteri telefon numarası." },
          date: { type: "string", description: "Rezervasyon tarihi (YYYY-MM-DD formatında)." },
          time: { type: "string", description: "Rezervasyon saati (HH:MM formatında). Örn: 20:00" },
          guestCount: { type: "integer", description: "Kişi sayısı." },
          note: { type: "string", description: "Varsa özel not veya istek." }
        },
        required: ["name", "phone", "date", "time", "guestCount"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_artist",
      description: "Sisteme yeni bir sanatçı ekler.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Sanatçının adı." },
          bio: { type: "string", description: "Sanatçının biyografisi veya kısa açıklaması." }
        },
        required: ["name"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_event",
      description: "Sisteme yeni bir etkinlik (konser, organizasyon) ekler.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Etkinlik başlığı veya adı." },
          date: { type: "string", description: "Etkinlik tarihi (YYYY-MM-DD formatında)." },
          time: { type: "string", description: "Etkinlik saati (HH:MM formatında)." },
          description: { type: "string", description: "Etkinlik detayı veya açıklaması." }
        },
        required: ["title", "date", "time"]
      }
    }
  }
];

export async function askGroqWithContext(query) {
  const apiKeySetting = await prisma.setting.findUnique({ where: { key: "groq_api_key" } });
  if (!apiKeySetting || !apiKeySetting.value) {
    return "❌ Groq API anahtarı sistemde bulunamadı. Lütfen ayarlardan ekleyin.";
  }
  const groqApiKey = apiKeySetting.value;

  // 1. Fetch Context Data
  const rooms = await prisma.room.findMany({ include: { tables: true } });
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

  const reservations = await prisma.reservation.findMany({
    where: { date: { gte: todayStart } },
    include: { tables: { include: { room: true } } },
    orderBy: { date: 'asc' }
  });

  const artists = await prisma.artist.findMany();
  const events = await prisma.event.findMany({ where: { date: { gte: todayStart } } });

  let totalCapacity = 0;
  let contextText = "--- MEKAN DURUMU ---\n";
  rooms.forEach(room => {
    let roomCap = 0;
    room.tables.forEach(t => roomCap += t.capacity);
    totalCapacity += roomCap;
    contextText += `${room.name} (${roomCap} Kişi) - ${room.tables.length} Masa\n`;
  });
  contextText += `\nToplam Mekan Kapasitesi: ${totalCapacity} Kişi\n\n`;

  contextText += "--- GELECEK REZERVASYONLAR ---\n";
  if (reservations.length === 0) contextText += "Rezervasyon bulunmuyor.\n";
  reservations.forEach(res => {
    const dateStr = new Date(res.date).toLocaleString("tr-TR");
    const status = res.status === "APPROVED" ? "Onaylı" : res.status === "PENDING" ? "Bekliyor" : "İptal";
    const tables = res.tables && res.tables.length > 0 ? res.tables.map(t => `${t.name}`).join(", ") : "Yok";
    contextText += `- [${status}] ${dateStr} | ${res.name} | ${res.guestCount} Kişi | Masalar: ${tables}\n`;
  });

  contextText += "\n--- SANATÇILAR ---\n";
  if (artists.length === 0) contextText += "Kayıtlı sanatçı yok.\n";
  artists.forEach(a => contextText += `- ${a.name}\n`);

  contextText += "\n--- GELECEK ETKİNLİKLER ---\n";
  if (events.length === 0) contextText += "Etkinlik bulunmuyor.\n";
  events.forEach(e => {
    const dateStr = new Date(e.date).toLocaleString("tr-TR");
    contextText += `- ${e.title} | ${dateStr}\n`;
  });

  const systemPrompt = `Sen HayalMest restoranının profesyonel yapay zeka asistanı ve Sistem Yöneticisisin.
Görevlerin:
1. Gelen sorulara sadece GÜNCEL VERİLERİ kullanarak kısa ve öz cevap vermek.
2. Kullanıcı yeni bir rezervasyon, sanatçı veya etkinlik EKLEMENİ isterse araçları (tools) kullanmak. Tarih verilmezse bugünü baz al. Saat verilmezse mantıklı bir saat (örn: 20:00) seç.
3. Araçları kullanarak işlem yaptıktan sonra kullanıcıya kibar bir bilgi mesajı ver.

GÜNCEL VERİLER (Şu anki zaman: ${now.toLocaleString("tr-TR")}):
${contextText}
`;

  let messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: query }
  ];

  try {
    let response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${groqApiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: messages,
        tools: tools,
        tool_choice: "auto",
        temperature: 0.3,
        max_tokens: 1024
      })
    });

    if (!response.ok) return "⚠️ Groq servisi şu anda yanıt vermiyor.";

    let data = await response.json();
    let responseMessage = data.choices[0].message;

    // If the model decides to call tools
    if (responseMessage.tool_calls) {
      messages.push(responseMessage); // Add assistant's tool call request

      for (const toolCall of responseMessage.tool_calls) {
        const functionName = toolCall.function.name;
        const args = JSON.parse(toolCall.function.arguments);
        let functionResponse = "";

        try {
          if (functionName === "create_reservation") {
            const dateObj = new Date(`${args.date}T${args.time}:00+03:00`);
            await prisma.reservation.create({
              data: {
                name: args.name,
                phone: args.phone || "Bilinmiyor",
                date: dateObj,
                guestCount: args.guestCount,
                note: args.note || "",
                status: "PENDING"
              }
            });
            functionResponse = "Rezervasyon başarıyla veritabanına eklendi.";
          } 
          else if (functionName === "create_artist") {
            await prisma.artist.create({
              data: { name: args.name, bio: args.bio || "" }
            });
            functionResponse = "Sanatçı başarıyla eklendi.";
          }
          else if (functionName === "create_event") {
            const dateObj = new Date(`${args.date}T${args.time}:00+03:00`);
            await prisma.event.create({
              data: { title: args.title, date: dateObj, description: args.description || "" }
            });
            functionResponse = "Etkinlik başarıyla eklendi.";
          }
        } catch (dbError) {
          console.error("DB Error in Tool Call:", dbError);
          functionResponse = "Veritabanına kaydedilirken hata oluştu: " + dbError.message;
        }

        // Add tool response to messages
        messages.push({
          tool_call_id: toolCall.id,
          role: "tool",
          name: functionName,
          content: functionResponse,
        });
      }

      // Second request to get the final response from AI
      response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${groqApiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: messages,
          temperature: 0.3,
          max_tokens: 1024
        })
      });

      data = await response.json();
      return data.choices[0].message.content;
    }

    // No tool calls, just return text
    return responseMessage.content;
  } catch (error) {
    console.error("Groq Request Failed:", error);
    return "⚠️ Groq bağlantısında bir hata oluştu.";
  }
}
