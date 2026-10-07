import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth'

const firebaseConfig = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'scheme-assistant-app',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:520495266533:web:6dcd8c18d810f24fdcb20c',
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyB2asDHqlpCa7G2jzQCa9QBmMVFKRH77OU',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'scheme-assistant-app.firebaseapp.com',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'scheme-assistant-app.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '520495266533',
}

function initFirebaseApp(): FirebaseApp {
  if (getApps().length > 0) {
    return getApp()
  }
  return initializeApp(firebaseConfig)
}

export const firebaseApp: FirebaseApp = initFirebaseApp()
export const firebaseAuth: Auth = getAuth(firebaseApp)
export const googleAuthProvider = new GoogleAuthProvider()
