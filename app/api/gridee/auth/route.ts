import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const GRIDEE_API_BASE = "https://gridee.onrender.com";
const FIREBASE_API_KEY = "AIzaSyDN63teqDI3fvPQRY2NUyGbmiCklbLgkls";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { mode, email, password, idToken, accessToken, userId } = body;

    // Mode 1: Direct Access Token (bypass if user already has one)
    if (mode === "token" && accessToken) {
      // Validate token by fetching user profile
      const userRes = await fetch(`${GRIDEE_API_BASE}/api/oauth2/user`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
      });

      if (userRes.ok) {
        const userData = await userRes.json();
        return NextResponse.json({
          success: true,
          accessToken,
          user: userData,
        });
      }

      return NextResponse.json(
        { success: false, error: "Invalid or expired Gridee token" },
        { status: 401 }
      );
    }

    // Mode 2: Email + Password via Firebase Auth REST API
    if (mode === "email" && email && password) {
      const fbRes = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            password,
            returnSecureToken: true,
          }),
        }
      );

      const fbData = await fbRes.json();
      if (!fbRes.ok) {
        const errMsg = fbData?.error?.message || "Failed to authenticate with Firebase";
        return NextResponse.json({ success: false, error: errMsg }, { status: 400 });
      }

      const firebaseIdToken = fbData.idToken;

      // Exchange Firebase ID Token with Gridee backend
      const exchangeRes = await fetch(`${GRIDEE_API_BASE}/api/auth/firebase/exchange`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ idToken: firebaseIdToken }),
      });

      const exchangeData = await exchangeRes.json();
      if (!exchangeRes.ok) {
        return NextResponse.json(
          { success: false, error: exchangeData?.message || "Gridee token exchange failed" },
          { status: exchangeRes.status }
        );
      }

      return NextResponse.json({
        success: true,
        accessToken: exchangeData.access_token || exchangeData.accessToken || exchangeData.token,
        tokenType: exchangeData.tokenType || "Bearer",
        user: exchangeData.user || { email: fbData.email, localId: fbData.localId },
      });
    }

    // Mode 3: Google ID Token via Firebase Web SDK
    if (mode === "google" && idToken) {
      const exchangeRes = await fetch(`${GRIDEE_API_BASE}/api/auth/firebase/exchange`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ idToken }),
      });

      const exchangeData = await exchangeRes.json();
      if (!exchangeRes.ok) {
        return NextResponse.json(
          { success: false, error: exchangeData?.message || "Gridee Google exchange failed" },
          { status: exchangeRes.status }
        );
      }

      return NextResponse.json({
        success: true,
        accessToken: exchangeData.access_token || exchangeData.accessToken || exchangeData.token,
        tokenType: exchangeData.tokenType || "Bearer",
        user: exchangeData.user || {},
      });
    }

    return NextResponse.json({ success: false, error: "Invalid auth parameters" }, { status: 400 });
  } catch (err: any) {
    console.error("[Gridee Auth Error]", err);
    return NextResponse.json({ success: false, error: err.message || "Internal server error" }, { status: 500 });
  }
}
