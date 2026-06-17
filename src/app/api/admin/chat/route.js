import { NextResponse } from "next/server";
import { askGroqWithContext } from "@/lib/groq";

export async function POST(request) {
  try {
    const { message } = await request.json();

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const aiResponse = await askGroqWithContext(message);
    
    return NextResponse.json({ reply: aiResponse });
  } catch (error) {
    console.error("Chat API Error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
