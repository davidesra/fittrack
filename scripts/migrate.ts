/**
 * Migration script: add trainingRoutine and customRoutine columns to goals table
 * Run with: npx tsx --env-file=.env.local scripts/migrate.ts
 */
import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

async function migrate() {
  await sql`ALTER TABLE goals ADD COLUMN IF NOT EXISTS training_routine TEXT DEFAULT 'ppl'`;
  await sql`ALTER TABLE goals ADD COLUMN IF NOT EXISTS custom_routine JSONB`;
  console.log("✓ Added training_routine and custom_routine columns to goals table");
}

migrate().catch((e) => {
  console.error("Migration failed:", e);
  process.exit(1);
});
