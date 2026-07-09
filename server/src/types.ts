import type { createDb } from "./db/client";

export type Env = {
  Bindings: { DATABASE_URL: string; CLERK_SECRET_KEY: string; RATE_LIMIT_KV: KVNamespace };
  Variables: { userId: string; db: ReturnType<typeof createDb> };
};
