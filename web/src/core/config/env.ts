import { envSchema, type Env } from "./env.schema";

function getRuntimeEnv(): Env {
  const parsed = envSchema.safeParse({
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_AUTH_SECRET: process.env.NEXT_PUBLIC_AUTH_SECRET,
  });

  if (!parsed.success) {
    console.warn(
      "⚠️ Invalid client environment variables:",
      parsed.error.format(),
    );
    return {
      NODE_ENV: "development",
      NEXT_PUBLIC_API_URL: "http://127.0.0.1:3000/api",
    };
  }

  return parsed.data;
}

export const env = getRuntimeEnv();
