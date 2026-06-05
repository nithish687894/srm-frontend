import { useAuthStore } from "@/lib/store";
import { pushNative } from "@/lib/pushNotify";
import { registerFCMToken } from "@/lib/fcmManager";

export async function enableAcademicAlerts(
  showToast: (title: string, body: string, type?: "success" | "error" | "info") => void
) {
  const store = useAuthStore.getState();

  try {
    const permission = await Notification.requestPermission();

    if (permission === "granted") {
      // 1. Success Toast
      showToast(
        "Academic alerts enabled ✅",
        "Nexus will notify you about important attendance and marks updates.",
        "success"
      );

      // 2. Zustand Store States
      store.setAcademicAlertsEnabled(true);
      store.setAcademicAlertsPrompted(true);

      // 3. Mark in localStorage
      localStorage.setItem("academicAlertsEnabled", "true");
      localStorage.setItem("academicAlertsPrompted", "true");

      // 4. Register FCM token (Firebase Cloud Messaging)
      //    This allows push notifications even when the app is fully closed.
      registerFCMToken().then((token) => {
        if (token) {
          console.log("[Notifications] FCM token registered successfully.");
        } else {
          console.warn("[Notifications] FCM token registration returned null — using fallback SW push.");
        }
      });

      // 5. Flag for notification center
      if (!localStorage.getItem("hasAddedAlertsEnabledNotification")) {
        localStorage.setItem("hasAddedAlertsEnabledNotification", "true");
      }

      // 6. Send welcome push after 8 seconds (one-time per device)
      if (!localStorage.getItem("hasSentWelcomeNotification")) {
        localStorage.setItem("hasSentWelcomeNotification", "true");

        setTimeout(() => {
          pushNative({
            title: "Nexus has your back 😌",
            body: "Don't worry. We'll remind you when something important changes.",
            url: "/notifications",
            tag: "nexus-welcome",
          });
        }, 8000);
      }
    } else if (permission === "denied") {
      showToast(
        "Notifications are off",
        "You can enable academic alerts later in Profile.",
        "info"
      );
      store.setAcademicAlertsEnabled(false);
      store.setAcademicAlertsPrompted(true);
      localStorage.setItem("academicAlertsEnabled", "false");
      localStorage.setItem("academicAlertsPrompted", "true");
    } else {
      store.setAcademicAlertsEnabled(false);
      localStorage.setItem("academicAlertsEnabled", "false");
    }
  } catch (err) {
    console.error("Failed to request notification permission:", err);
    showToast(
      "Permission error",
      "An unexpected error occurred while setting up notifications.",
      "error"
    );
  }
}
