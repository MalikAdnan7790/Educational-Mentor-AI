import { createClient } from "@libsql/client";
import { execSync } from "child_process";
import path from "path";

async function main() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url) {
    console.error("Set TURSO_DATABASE_URL first");
    process.exit(1);
  }

  console.log("Generating schema SQL from Prisma schema...");
  const sql = execSync(
    `npx prisma migrate diff --from-empty --to-schema-datamodel "${path.join(__dirname, "..", "prisma", "schema.prisma")}" --script`,
    { encoding: "utf-8" }
  );

  if (!sql.trim()) {
    console.log("No schema changes to push.");
    process.exit(0);
  }

  console.log(`Connecting to Turso at ${url}`);
  const client = createClient({ url, authToken });

  const statements = sql
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  console.log(`Executing ${statements.length} SQL statements...`);
  let created = 0, skipped = 0, failed = 0;
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    const label = stmt.split("\n")[0].slice(0, 70);
    try {
      await client.execute(stmt);
      created++;
      console.log(`  [${i + 1}/${statements.length}] OK: ${label}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("already exists")) {
        skipped++;
        console.log(`  [${i + 1}/${statements.length}] SKIP (exists): ${label}`);
      } else {
        failed++;
        console.error(`  [${i + 1}/${statements.length}] FAIL: ${label}`);
        console.error(`    ${msg}`);
      }
    }
  }

  console.log(`Done! Created: ${created}, Skipped: ${skipped}, Failed: ${failed}`);
  client.close();

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Failed:", err.message);
  process.exit(1);
});
