import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, bodyPhotos } from "@/lib/db";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { todayString } from "@/lib/utils";
import { z } from "zod";

const MetaSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).default(todayString()),
  weightKg: z.preprocess(
    (v) => (v ? parseFloat(String(v)) : undefined),
    z.number().positive().optional()
  ),
  note: z.string().max(500).optional(),
});

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
  if (!file) {
    return NextResponse.json({ error: "No photo provided" }, { status: 400 });
  }

  const meta = MetaSchema.safeParse({
    date: formData.get("date"),
    weightKg: formData.get("weightKg"),
    note: formData.get("note"),
  });

  if (!meta.success) {
    return NextResponse.json({ error: meta.error.flatten() }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const { publicId, secureUrl } = await uploadToCloudinary(
      buffer,
      `fittrack/body-photos/${session.user.id}`
    );

    const [photo] = await db
      .insert(bodyPhotos)
      .values({
        userId: session.user.id,
        date: meta.data.date,
        cloudinaryPublicId: publicId,
        cloudinaryUrl: secureUrl,
        weightKg: meta.data.weightKg ?? null,
        note: meta.data.note ?? null,
      })
      .returning();

    return NextResponse.json({ photo });
  } catch (error) {
    console.error("Photo upload error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 }
    );
  }
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const photos = await db.query.bodyPhotos.findMany({
    where: (bp, { eq }) => eq(bp.userId, session.user.id),
    orderBy: (bp, { desc }) => [desc(bp.date)],
  });

  return NextResponse.json({ photos });
}
