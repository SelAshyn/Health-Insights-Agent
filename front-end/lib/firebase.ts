// lib/firebase.ts
// This file initializes Firebase and exports the auth instance.
// It runs once when first imported — subsequent imports reuse the same instance.

import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore";

// These values come from your Firebase project settings.
// In production, store them in .env.local — never commit real credentials to git.
// Next.js exposes env vars prefixed with NEXT_PUBLIC_ to the browser (client-side).
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// getApps() returns all initialized Firebase apps.
// This guard prevents re-initializing on hot reloads in development,
// which would throw a "Firebase App named '[DEFAULT]' already exists" error.
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
// getStorage returns the Storage service — used to upload/download files
export const storage = getStorage(app);
// getFirestore returns the Firestore database — used to store session metadata
export const db = getFirestore(app);
