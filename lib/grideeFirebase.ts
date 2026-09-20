import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword } from "firebase/auth";

export const grideeFirebaseConfig = {
  apiKey: "AIzaSyDN63teqDI3fvPQRY2NUyGbmiCklbLgkls",
  authDomain: "braided-tracker-480615-v5.firebaseapp.com",
  projectId: "braided-tracker-480615-v5",
  storageBucket: "braided-tracker-480615-v5.firebasestorage.app",
  messagingSenderId: "961075110838",
  appId: "1:961075110838:android:406a2dec5d6986ed2f9717",
};

export function getGrideeAuth() {
  const existing = getApps().find((a) => a.name === "gridee");
  const app = existing || initializeApp(grideeFirebaseConfig, "gridee");
  return getAuth(app);
}

export async function signInGrideeWithGoogle(): Promise<string> {
  const auth = getGrideeAuth();
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  const result = await signInWithPopup(auth, provider);
  return await result.user.getIdToken();
}

export async function signInGrideeWithEmail(email: string, pass: string): Promise<string> {
  const auth = getGrideeAuth();
  const result = await signInWithEmailAndPassword(auth, email, pass);
  return await result.user.getIdToken();
}
