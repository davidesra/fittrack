import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, workouts } from "@/lib/db";
import { eq, and } from "drizzle-orm";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: workoutId } = await params;
  const userId = session.user.id;

  const workout = await db.query.workouts.findFirst({
    where: and(eq(workouts.id, workoutId), eq(workouts.userId, userId)),
  });

  if (!workout) {
    return NextResponse.json({ error: "Workout not found" }, { status: 404 });
  }

  // Cascade deletes exercises via FK constraint
  await db.delete(workouts).where(eq(workouts.id, workoutId));

  return NextResponse.json({ success: true });
}
