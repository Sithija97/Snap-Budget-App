import type { createDb } from "./db/client";

export type Env = {
  Bindings: {
    DATABASE_URL: string;
    CLERK_SECRET_KEY: string;
    RATE_LIMIT_KV: KVNamespace;
    GEMINI_API_KEY: string;
    CLOUDINARY_CLOUD_NAME: string;
    CLOUDINARY_API_KEY: string;
    CLOUDINARY_API_SECRET: string;
  };
  Variables: { userId: string; db: ReturnType<typeof createDb> };
};
