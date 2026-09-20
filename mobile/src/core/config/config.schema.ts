import { z } from 'zod';

/**
 * Zod schema validating environment configuration.
 * Catches missing or invalid environment variables at startup.
 */
export const configSchema = z.object({
  apiUrl: z.string().url(),
  environment: z.enum(['development', 'staging', 'production']).default('development'),
  requestTimeoutMs: z.number().int().positive().default(10000),
  cloudinaryCloudName: z.string().default('dzao8h1ay'),
  cloudinaryApiKey: z.string().default('818269883432412'),
  cloudinaryApiSecret: z.string().default('TWQzFg_c4N28mPs3g07qlC29HT8'),
  firebase: z.object({
    projectId: z.string().default('scheme-assistant-app'),
    appId: z.string().default('1:520495266533:web:6dcd8c18d810f24fdcb20c'),
    apiKey: z.string().default('AIzaSyB2asDHqlpCa7G2jzQCa9QBmMVFKRH77OU'),
    authDomain: z.string().default('scheme-assistant-app.firebaseapp.com'),
    storageBucket: z.string().default('scheme-assistant-app.firebasestorage.app'),
    messagingSenderId: z.string().default('520495266533'),
  }),
});

export type AppConfig = z.infer<typeof configSchema>;
