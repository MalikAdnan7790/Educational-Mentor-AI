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
  for (const stmt of statements) {
    await client.execute(stmt);
  }

  console.log("Schema pushed to Turso successfully!");
  client.close();
}

main().catch((err) => {
  console.error("Failed:", err.message);
  process.exit(1);
});
