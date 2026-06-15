import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { put } from "@vercel/blob";
import path from "path";
import crypto from "crypto";

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Create a unique filename
    const originalExt = path.extname(file.name);
    const uniqueSuffix = crypto.randomBytes(8).toString('hex');
    const filename = `${uniqueSuffix}${originalExt}`;

    // Upload to Vercel Blob
    let fileUrl = "";
    try {
      const blob = await put(filename, file, { access: 'public' });
      fileUrl = blob.url;
    } catch (e) {
      console.error("Vercel Blob failed, falling back to local for dev:", e);
      // Optional local fallback if no token provided during dev
      const { writeFile } = require("fs/promises");
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const savePath = path.join(process.cwd(), "public", "uploads", filename);
      await writeFile(savePath, buffer);
      fileUrl = `/uploads/${filename}`;
    }

    // Determine type based on mime type or extension
    const mimeType = file.type || "";
    let mediaType = "IMAGE";
    if (mimeType.startsWith("video/") || originalExt.toLowerCase() === ".mp4" || originalExt.toLowerCase() === ".webm") {
      mediaType = "VIDEO";
    }

    return NextResponse.json({ 
      success: true, 
      url: fileUrl, 
      type: mediaType 
    }, { status: 201 });

  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
