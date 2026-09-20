# Scheme App — Play Store Release & Architecture Roadmap

This document outlines the component architecture, role divisions, and the step-by-step checklist required to publish the Scheme Mobile App to the Google Play Store with zero recurring server costs.

---

## 1. Project Component Roles & Responsibilities

| Component | Technology | Current Role | Production Strategy |
| :--- | :--- | :--- | :--- |
| **Mobile Client** | React Native / Expo (SDK 52) | User interface, offline scheme browsing, AI advisor chat, and document vault. | Shipped as an Android App Bundle (`.aab`) to Google Play Store. |
| **Identity & Auth** | Firebase Auth (Client SDK) | Manages user accounts via Email/Password (magic verification link) and 1-tap Google Sign-In. | 100% serverless; operates directly between phone and Google Auth servers. |
| **Database (Source of Truth)** | Aiven PostgreSQL Cloud (`defaultdb`) | Cloud persistence for 21 relational tables: citizen accounts, profiles, vault metadata, chat sessions. | Remains primary source of truth; accessed securely via the Cloud API Bridge. |
| **Local Scheme Cache** | Embedded SQLite (`schemes.db`, 8.3 MB) | Stores all 4,147 government schemes, benefits, and eligibility rules locally on the device. | **0ms latency, 100% offline.** Scheme queries do NOT hit the network or database server. |
| **Document Vault Storage** | Cloudinary (`dzao8h1ay`) | Stores binary files (Aadhaar, income certificates, ration cards) in secure HTTPS cloud storage. | Direct client-to-Cloudinary upload using an **Unsigned Upload Preset**. |
| **AI Advisor Intelligence** | Google Gemini API | Powers natural language scheme recommendations and advisory chat conversations. | Direct or proxied LLM inference. |
| **API Bridge (Current Gap)** | PostgREST / Vercel Serverless | Bridges mobile HTTP requests (`fetch`) to Aiven PostgreSQL for users, profiles, vault, and chat sync. | **Vercel Serverless Functions** (Free Hobby tier, no credit card required) replacing local Docker PostgREST. |

---

## 2. Key Architecture Insight: Minimal API Surface

Because all **4,147 schemes** are bundled in the embedded `schemes.db` database inside the mobile app:
- **No heavy backend database server is needed to serve scheme searches.**
- The cloud API only handles sync for **4 user-specific tables**:
  1. `users` (Account records, verification status)
  2. `profiles` (Full name, demographic state, income)
  3. `user_documents` (Vault document metadata and Cloudinary URLs)
  4. `chat_sessions` & `chat_messages` (Cross-device chat sync)

This tiny footprint easily fits within Vercel's free serverless tier indefinitely.

---

## 3. Play Store Release Todo List

### Phase 1: Cloud API Bridge (Vercel Serverless + Aiven PostgreSQL)
- [ ] Create a lightweight API bridge project (`api/` or Vercel serverless) with `pg` connecting to Aiven PostgreSQL.
- [ ] Expose endpoints matching the mobile app's contract:
  - `GET /users?email=eq.<email>` & `POST /users` (Account lookup & provisioning)
  - `GET /profiles?user_id=eq.<id>` & `POST /profiles` (Citizen profile management)
  - `GET /user_documents?user_id=eq.<id>` & `POST /user_documents` (Vault metadata sync)
  - `POST /chat_sessions` & `POST /chat_messages` (Chat synchronization)
- [ ] Deploy to Vercel (free, no credit card required) and verify SSL connection to Aiven.
- [ ] Update `mobile/.env` `EXPO_PUBLIC_API_URL` to point to the live Vercel HTTPS endpoint.
- [ ] Verify complete auth, vault, and chat sync on physical phone without running local Docker.

### Phase 2: Security Sanitization & Credential Protection
- [ ] Create an **Unsigned Upload Preset** in the Cloudinary Dashboard (e.g., `scheme_vault_unsigned`).
- [ ] Update `mobile/src/features/vault/repositories/vault.api.ts` to use unsigned uploads.
- [ ] Remove `EXPO_PUBLIC_CLOUDINARY_API_SECRET` from `mobile/.env` to eliminate private key leakage in client bundles.
- [ ] Verify that no private API keys or database connection strings are exposed in client-side code.

### Phase 3: Android Release Keystore & App Bundle (.aab)
- [ ] Generate production upload keystore:
  ```bash
  keytool -genkeypair -v -storetype PKCS12 -keystore my-upload-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
  ```
- [ ] Configure `android/app/build.gradle` signing configurations for `release`.
- [ ] Extract SHA-1 fingerprint of the upload key:
  ```bash
  keytool -list -v -keystore my-upload-key.keystore
  ```
- [ ] Add the SHA-1 fingerprint to Firebase Console (`com.schememobile.app`) to enable Google Sign-In on production builds.
- [ ] Run `./gradlew bundleRelease` in `mobile/android` to generate the production `.aab`.

### Phase 4: Google Play Policy & Legal Requirements
- [ ] Add an in-app "Delete Account" button in `SettingsScreen.tsx` that removes citizen data.
- [ ] Publish a public **Privacy Policy** URL (e.g. hosted on GitHub Pages or Vercel).
- [ ] Publish a public web page/form for Account & Data Deletion requests (Google Play mandatory policy).
- [ ] Prepare declarations for the Google Play Data Safety form:
  - Personal info: Name, Email
  - Photos & docs: Uploaded citizen files (Vault)
  - Device identifiers: App diagnostics

### Phase 5: Google Play Console Submission
- [ ] Create Google Play Developer account ($25 one-time fee).
- [ ] Prepare store listing visual assets:
  - App Icon (512x512 PNG, 32-bit, alpha channel disabled)
  - Feature Graphic (1024x500 PNG)
  - 4–8 High-resolution screenshots (1080x1920 or higher)
- [ ] Draft store listing metadata:
  - Title (≤ 30 characters)
  - Short Description (≤ 80 characters)
  - Full Description (≤ 4,000 characters)
- [ ] Upload `.aab` to Google Play Console (Closed Testing track).
- [ ] Complete the 14-day closed testing period with 20 testers, then promote to Production release.
