import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { anthropic, CLAUDE_MODEL } from "@/lib/anthropic";
import { uploadToCloudinary } from "@/lib/cloudinary";

const SYSTEM_PROMPT = `You are a nutrition expert and dietitian AI. When given a photo of food or a meal description, you analyze it and provide accurate nutritional estimates.

Always respond with a JSON object in this exact format:
{
  "name": "Brief meal/food name",
  "description": "What you can see in the photo",
  "calories": 450,
  "protein": 35,
  "carbs": 40,
  "fat": 15,
  "fiber": 6,
  "confidence": "high|medium|low",
  "notes": "Any caveats about the estimate"
}

Provide realistic estimates. If portion size is unclear, assume a typical single serving.`;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const file = formData.get("photo") as File | null;
  const textDescription = formData.get("description") as string | null;

  if (!file && !textDescription) {
    return NextResponse.json(
      { error: "Provide either a photo or text description" },
      { status: 400 }
    );
  }

  try {
    let cloudinaryUrl: string | undefined;
    let messageContent: Parameters<typeof anthropic.messages.create>[0]["messages"][0]["content"];

    if (file) {
      // Convert file to base64 for Claude vision
      const buffer = Buffer.from(await file.arrayBuffer());
      const base64 = buffer.toString("base64");
      const mediaType = (file.type as "image/jpeg" | "image/png" | "image/webp" | "image/gif") || "image/jpeg";

      // Upload to Cloudinary for storage
      try {
        const uploaded = await uploadToCloudinary(buffer, "fittrack/meals");
        cloudinaryUrl = uploaded.secureUrl;
      } catch {
        // Cloudinary upload failed — continue with analysis only
      }

      messageContent = [
        {
          type: "image",
          source: { type: "base64", media_type: mediaType, data: base64 },
        },
        {
          type: "text",
          text: "Analyze this meal photo and provide nutritional estimates as JSON.",
        },
      ];
    } else {
      // Text-only analysis
      messageContent = [
        {
          type: "text",
          text: `Analyze this meal/food description and provide nutritional estimates as JSON:\n\n${textDescription}`,
        },
      ];
    }

    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      thinking: { type: "adaptive" },
      messages: [{ role: "user", content: messageContent }],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("No text response from Claude");
    }

    // Parse JSON from response (may be wrapped in markdown code blocks)
    const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Invalid response format from Claude");

    const nutritionData = JSON.parse(jsonMatch[0]);

    return NextResponse.json({
      ...nutritionData,
      photoUrl: cloudinaryUrl,
      source: file ? "photo_ai" : "text_ai",
    });
  } catch (error) {
    console.error("Photo analysis error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Analysis failed" },
      { status: 500 }
    );
  }
}
