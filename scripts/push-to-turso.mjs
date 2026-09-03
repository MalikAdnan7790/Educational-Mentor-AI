import { createClient } from "@libsql/client";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const sqlPath = resolve(__dirname, "../schema-sql.txt");
const sql = readFileSync(sqlPath, "utf-8");

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const lines = sql.split("\n");
const statements = [];
let current = [];

for (const line of lines) {
  if (line.startsWith("-- CreateTable") || line.startsWith("-- CreateIndex")) {
    if (current.length > 0) {
      statements.push(current.join("\n").trim());
    }
    current = [];
    continue;
  }
  if (line.trim() === "" && current.length === 0) continue;
  current.push(line);
}
if (current.length > 0) {
  statements.push(current.join("\n").trim());
}

const filtered = statements.filter((s) => s && s.includes("("));

console.log(`Pushing ${filtered.length} statements to Turso...`);

for (let i = 0; i < filtered.length; i++) {
  const stmt = filtered[i];
  const firstLine = stmt.split("\n")[0].slice(0, 80);
  try {
    await client.execute({ sql: stmt, args: [] });
    console.log(`  [${i + 1}/${filtered.length}] OK: ${firstLine}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("already exists")) {
      console.log(`  [${i + 1}/${filtered.length}] SKIP (exists): ${firstLine}`);
    } else {
      console.error(`  [${i + 1}/${filtered.length}] FAIL: ${firstLine}`);
      console.error(`    ${msg}`);
    }
  }
}

console.log("Done!");
client.close();
