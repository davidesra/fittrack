import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, goals, users } from "@/lib/db";
import { eq } from "drizzle-orm";
import { z } from "zod";

const GoalsSchema = z.object({
  targetCalories: z.number().min(0).optional(),
  targetProtein: z.number().min(0).optional(),
  targetCarbs: z.number().min(0).optional(),
  targetFat: z.number().min(0).optional(),
  targetFiber: z.number().min(0).optional(),
  targetWeight: z.number().min(0).optional(),
  targetLifts: z.record(z.string(), z.number()).optional(),
  trainingRoutine: z.enum(["ppl", "5day", "custom"]).optional(),
  customRoutine: z.array(z.string()).optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [goal, user] = await Promise.all([
    db.query.goals.findFirst({ where: eq(goals.userId, session.user.id) }),
    db.query.users.findFirst({
      where: eq(users.id, session.user.id),
      columns: { garminAccessToken: true },
    }),
  ]);

  return NextResponse.json({
    goals: goal ?? null,
    garminConnected: !!user?.garminAccessToken,
  });
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = GoalsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const userId = session.user.id;
  const existing = await db.query.goals.findFirst({
    where: eq(goals.userId, userId),
  });

  const { targetLifts, customRoutine, ...rest } = parsed.data;
  const jsonbFields = {
    ...(targetLifts !== undefined ? { targetLifts: targetLifts as Record<string, number> } : {}),
    ...(customRoutine !== undefined ? { customRoutine } : {}),
  };

  if (existing) {
    const [updated] = await db
      .update(goals)
      .set({ ...rest, ...jsonbFields, updatedAt: new Date() })
      .where(eq(goals.userId, userId))
      .returning();
    return NextResponse.json({ goals: updated });
  } else {
    const [created] = await db
      .insert(goals)
      .values({ userId, ...rest, ...jsonbFields })
      .returning();
    return NextResponse.json({ goals: created });
  }
}
