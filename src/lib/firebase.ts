/* ------------------------------------------------------------------ */
/*  Firebase client setup.                                             */
/*  All config comes from environment variables — see .env.example.    */
/*  Values here are intentionally empty placeholders; the portal runs  */
/*  fully client-side-rendered until real credentials are provided.    */
/* ------------------------------------------------------------------ */
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
};

/** True once real Firebase credentials have been provided. */
export const isFirebaseConfigured =
  firebaseConfig.apiKey !== "" && firebaseConfig.projectId !== "";

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

if (isFirebaseConfigured) {
  // Reuse the app across hot-reloads / serverless invocations.
  app = getApps().length > 0 ? getApps()[0]! : initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);

  /* Firebase App Check — attests that requests come from this genuine web
   * app, blocking API abuse from bots and foreign apps. Requires
   * NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_KEY; skipped silently without it. */
  const recaptchaKey = process.env.NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_KEY;
  if (recaptchaKey && typeof window !== "undefined") {
    import("firebase/app-check")
      .then(({ initializeAppCheck, ReCaptchaEnterpriseProvider }) => {
        try {
          initializeAppCheck(app!, {
            provider: new ReCaptchaEnterpriseProvider(recaptchaKey),
            isTokenAutoRefreshEnabled: true,
          });
        } catch {
          /* App Check unavailable (e.g. unsupported browser) — app still works */
        }
      })
      .catch(() => {
        /* firebase/app-check failed to load — app still works */
      });
  }
}

export { app, auth, db, storage };
