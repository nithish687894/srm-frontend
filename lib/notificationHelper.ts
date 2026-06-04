import { useAuthStore } from "@/lib/store";

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

      // 3. Mark in localStorage that notification alerts were successfully turned on
      localStorage.setItem("academicAlertsEnabled", "true");
      localStorage.setItem("academicAlertsPrompted", "true");

      // 4. Add dynamic flag so system notification registers inside Notification Center (only once per device)
      if (!localStorage.getItem("hasAddedAlertsEnabledNotification")) {
        localStorage.setItem("hasAddedAlertsEnabledNotification", "true");
      }

      // 5. Send First Friendly Welcome Push Notification after 8 seconds (one-time check per device)
      if (!localStorage.getItem("hasSentWelcomeNotification")) {
        // Set immediately to prevent multiple schedules
        localStorage.setItem("hasSentWelcomeNotification", "true");

        setTimeout(() => {
          const welcomeTitle = "Nexus has your back 😌";
          const welcomeBody = "Don’t worry. We’ll remind you when something important changes.";
          const welcomeOptions = {
            body: welcomeBody,
            icon: "/nexus-logo.png",
            badge: "/favicon-32x32.png",
            data: { url: "/notifications" }
          };

          const triggerFallback = () => {
            try {
              if (Notification.permission === "granted") {
                const notif = new Notification(welcomeTitle, {
                  body: welcomeBody,
                  icon: "/nexus-logo.png"
                });
                notif.onclick = (e) => {
                  e.preventDefault();
                  window.focus();
                  window.location.href = "/notifications";
                };
              }
            } catch (err) {
              console.error("Fallback notification failed:", err);
            }
          };

          if ("serviceWorker" in navigator) {
            navigator.serviceWorker.ready
              .then((reg) => {
                if (reg && "showNotification" in reg) {
                  return reg.showNotification(welcomeTitle, welcomeOptions);
                } else {
                  throw new Error("showNotification not supported on registration object");
                }
              })
              .catch((err) => {
                console.warn("Service worker notification failed, using fallback:", err);
                triggerFallback();
              });
          } else {
            triggerFallback();
          }
        }, 8000);
      }
    } else if (permission === "denied") {
      // Denied Alert Toast
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
      // Default (user dismissed prompt)
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
