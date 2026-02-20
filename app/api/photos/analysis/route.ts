import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { anthropic, CLAUDE_MODEL } from "@/lib/anthropic";
import { db, bodyPhotos, goals } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";

const RequestSchema = z.object({
  photoIds: z.array(z.string()).min(1).max(4),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = RequestSchema.safeParse(body);

  const userId = session.user.id;

  // Get all photos for context
  const allPhotos = await db.query.bodyPhotos.findMany({
    where: eq(bodyPhotos.userId, userId),
    orderBy: [desc(bodyPhotos.date)],
    limit: 20,
  });

  const userGoals = await db.query.goals.findFirst({
    where: eq(goals.userId, userId),
  });

  if (allPhotos.length === 0) {
    return new Response(
      "No body photos uploaded yet. Upload some photos to get an analysis.",
      { headers: { "Content-Type": "text/plain" } }
    );
  }

  // Select specific photos if requested, otherwise use first and most recent
  let selectedPhotos = allPhotos;
  if (parsed.success && parsed.data.photoIds.length > 0) {
    selectedPhotos = allPhotos.filter((p) =>
      parsed.data.photoIds.includes(p.id)
    );
  } else {
    // Default: compare first upload vs latest upload
    selectedPhotos = allPhotos.length > 1
      ? [allPhotos[allPhotos.length - 1], allPhotos[0]]
      : allPhotos.slice(0, 1);
  }

  const photoStats = allPhotos.map((p) => ({
    date: p.date,
    weightKg: p.weightKg,
    note: p.note,
  }));

  const goalsText = userGoals?.targetWeight
    ? `Target weight: ${userGoals.targetWeight}kg`
    : "No target weight set.";

  // Build message content with images
  const messageContent: Parameters<typeof anthropic.messages.create>[0]["messages"][0]["content"] = [];

  // Add images for selected photos
  for (const photo of selectedPhotos.slice(0, 4)) {
    // Fetch the image from Cloudinary URL
    try {
      const imgRes = await fetch(photo.cloudinaryUrl);
      if (imgRes.ok) {
        const buffer = Buffer.from(await imgRes.arrayBuffer());
        const base64 = buffer.toString("base64");
        const contentType = imgRes.headers.get("content-type") || "image/jpeg";
        messageContent.push({
          type: "image",
          source: {
            type: "base64",
            media_type: contentType as "image/jpeg" | "image/png" | "image/webp",
            data: base64,
          },
        });
        messageContent.push({
          type: "text",
          text: `Photo from ${photo.date}${photo.weightKg ? ` (${photo.weightKg}kg)` : ""}${photo.note ? `: ${photo.note}` : ""}`,
        });
      }
    } catch {
      // Skip inaccessible images
    }
  }

  const statsText = `
Photo history summary (${allPhotos.length} total photos):
${JSON.stringify(photoStats, null, 2)}

${goalsText}`;

  messageContent.push({
    type: "text",
    text: `You are a body composition expert. Analyze these progress photos and provide insights.

${statsText}

Please provide:

## Visual Progress Assessment
What changes are observable between the photos? Be specific and objective.

## Body Composition Observations
Based on the visual evidence and weight data, what do you observe about muscle mass, body fat distribution, and overall physique?

## Progress & Trends
What positive changes are evident? What areas show the most improvement?

## Recommendations
Based on the visual progress and goals, provide 3-5 specific recommendations for training and nutrition to continue improving.

Be encouraging, specific, and professional. Note that these are estimates based on visual assessment only.`,
  });

  const stream = await anthropic.messages.stream({
    model: CLAUDE_MODEL,
    max_tokens: 3000,
    thinking: { type: "adaptive" },
    messages: [{ role: "user", content: messageContent }],
  });

  const readableStream = new ReadableStream({
    async start(controller) {
      for await (const event of stream) {
        if (
          event.type === "content_block_delta" &&
          event.delta.type === "text_delta"
        ) {
          controller.enqueue(new TextEncoder().encode(event.delta.text));
        }
      }
      controller.close();
    },
  });

  return new Response(readableStream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
      "Cache-Control": "no-cache",
    },
  });
}
