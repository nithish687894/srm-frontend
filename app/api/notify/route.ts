/**
 * app/api/notify/route.ts
 * Vercel serverless API route — sends FCM push notifications via Firebase Admin.
 * Called by the client (academicWatcher) when attendance drops or marks update.
 *
 * POST /api/notify
 * Body: { token: string, title: string, body: string, url?: string, tag?: string }
 */

import { NextRequest, NextResponse } from "next/server";
import admin from "firebase-admin";

// ── Initialize Firebase Admin (singleton) ────────────────────────────────────
function getAdminApp() {
  if (admin.apps.length > 0) return admin.app();

  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;

  if (!privateKey || !clientEmail || !projectId) {
    throw new Error(
      "Firebase Admin env vars missing: FIREBASE_ADMIN_PRIVATE_KEY, FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PROJECT_ID"
    );
  }

  return admin.initializeApp({
    credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
  });
}

// ── POST handler ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, title, body: msgBody, url = "/notifications", tag } = body;

    if (!token || !title || !msgBody) {
      return NextResponse.json(
        { error: "Missing required fields: token, title, body" },
        { status: 400 }
      );
    }

    getAdminApp();

    const message: admin.messaging.Message = {
      token,
      notification: { title, body: msgBody },
      webpush: {
        notification: {
          title,
          body: msgBody,
          icon: "/nexus-logo.png",
          badge: "/favicon-32x32.png",
          tag: tag || "nexus-push",
          data: { url },
        },
        fcmOptions: { link: url },
      },
      data: { url, tag: tag || "nexus-push" },
    };

    const response = await admin.messaging().send(message);
    return NextResponse.json({ success: true, messageId: response });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[/api/notify] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
