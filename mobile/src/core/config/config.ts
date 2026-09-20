import { configSchema, type AppConfig } from './config.schema';

/**
 * Validated runtime configuration singleton.
 */
function loadConfig(): AppConfig {
  let apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';
  if (typeof process !== 'undefined' && process.release?.name === 'node' && apiUrl.includes('10.0.2.2')) {
    apiUrl = apiUrl.replace('10.0.2.2', 'localhost');
  }

  const rawConfig = {
    apiUrl,
    environment: process.env.EXPO_PUBLIC_ENV || (process.env.NODE_ENV === 'production' ? 'production' : 'development'),
    requestTimeoutMs: Number(process.env.EXPO_PUBLIC_TIMEOUT_MS) || 10000,
    cloudinaryCloudName: process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dzao8h1ay',
    cloudinaryApiKey: process.env.EXPO_PUBLIC_CLOUDINARY_API_KEY || '818269883432412',
    cloudinaryApiSecret: process.env.EXPO_PUBLIC_CLOUDINARY_API_SECRET || 'TWQzFg_c4N28mPs3g07qlC29HT8',
    firebase: {
      projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'scheme-assistant-app',
      appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '1:520495266533:web:6dcd8c18d810f24fdcb20c',
      apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'AIzaSyB2asDHqlpCa7G2jzQCa9QBmMVFKRH77OU',
      authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'scheme-assistant-app.firebaseapp.com',
      storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'scheme-assistant-app.firebasestorage.app',
      messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '520495266533',
    },
  };

  const parsed = configSchema.safeParse(rawConfig);

  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ');
    throw new Error(`[ConfigValidationError] Invalid environment configuration: ${issues}`);
  }

  return parsed.data;
}

export const config: AppConfig = loadConfig();
