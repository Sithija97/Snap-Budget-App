import { defineConfig } from "drizzle-kit";
import fs from "node:fs";
import path from "node:path";

// drizzle-kit runs in plain Node (not the Worker runtime), so it reads
// .dev.vars directly rather than going through wrangler's env injection.
function readDevVar(key: string): string {
  const raw = fs.readFileSync(path.join(__dirname, ".dev.vars"), "utf-8");
  const match = raw.match(new RegExp(`^${key}=(.*)$`, "m"));
  if (!match) throw new Error(`${key} not found in .dev.vars`);
  return match[1].trim();
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: readDevVar("DATABASE_URL"),
  },
});
