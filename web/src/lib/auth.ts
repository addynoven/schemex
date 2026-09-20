import { betterAuth } from "better-auth";
import { bearer, jwt } from "better-auth/plugins";
import { Pool } from "pg";

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://scheme_user:scheme_password@localhost:5432/scheme_db";

const isCloud = connectionString.includes("aivencloud") || connectionString.includes("sslmode=require");

const pool = new Pool({
  connectionString,
  ssl: isCloud ? { rejectUnauthorized: false } : undefined,
});

const authSecret =
  process.env.AUTH_SECRET ||
  process.env.NEXT_PUBLIC_AUTH_SECRET ||
  "insecure_development_secret_key_must_override_in_production";

export const auth = betterAuth({
  database: pool,
  secret:
    authSecret ||
    "insecure_development_secret_key_must_override_in_production",
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "google_client_id_placeholder",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "google_client_secret_placeholder",
      enabled: Boolean(process.env.GOOGLE_CLIENT_ID),
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID || "github_client_id_placeholder",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "github_client_secret_placeholder",
      enabled: Boolean(process.env.GITHUB_CLIENT_ID),
    },
  },
  plugins: [
    bearer(),
    jwt({
      jwt: {
        expirationTime: "7d",
      },
    }),
  ],
});
