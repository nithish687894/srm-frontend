import { useAuthStore } from "./store";

export async function enableAcademicAlerts(): Promise<{ success: boolean; toast: { title: string; body: string } }> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return {
      success: false,
      toast: {
        title: "Unsupported Device",
        body: "Push alerts are not supported on this browser/device."
      }
    };
  }

  const permission = await Notification.requestPermission();
  const store = useAuthStore.getState();

  if (permission === "granted") {
    // Enable state in store & prompt dismissed
    store.setAcademicAlertsEnabled(true);
    store.setAcademicAlertsPrompted(true);

    // Save alerts notification insertion state to localStorage
    localStorage.setItem("academicAlertsEnabled", "true");
    localStorage.setItem("academicAlertsPrompted", "true");

    if (localStorage.getItem("hasAddedAlertsEnabledNotification") !== "true" && localStorage.getItem("hasAddedAlertsEnabledNotification") !== "seen") {
      localStorage.setItem("hasAddedAlertsEnabledNotification", "true");
    }

    // Queue welcome push notification after 8 seconds (only once)
    if (localStorage.getItem("hasSentWelcomeNotification") !== "true") {
      localStorage.setItem("hasSentWelcomeNotification", "true");
      setTimeout(() => {
        const sendFallbackNotification = () => {
          try {
            const notif = new Notification("Nexus has your back 😌", {
              body: "Don’t worry. We’ll remind you when something important changes.",
              icon: "/nexus-logo.png",
              data: { url: "/notifications" }
            });
            notif.onclick = () => {
              window.focus();
              window.location.href = "/notifications";
            };
          } catch (err) {
            console.error("Failed to show fallback Notification:", err);
          }
        };

        if ("serviceWorker" in navigator) {
          navigator.serviceWorker.getRegistration().then((reg) => {
            if (reg && "showNotification" in reg) {
              reg.showNotification("Nexus has your back 😌", {
                body: "Don’t worry. We’ll remind you when something important changes.",
                icon: "/nexus-logo.png",
                badge: "/favicon-32x32.png",
                data: { url: "/notifications" }
              }).catch((err) => {
                console.warn("Failed to showNotification via SW registration", err);
                sendFallbackNotification();
              });
            } else {
              navigator.serviceWorker.ready.then((readyReg) => {
                if (readyReg && "showNotification" in readyReg) {
                  readyReg.showNotification("Nexus has your back 😌", {
                    body: "Don’t worry. We’ll remind you when something important changes.",
                    icon: "/nexus-logo.png",
                    badge: "/favicon-32x32.png",
                    data: { url: "/notifications" }
                  }).catch((err) => {
                    console.warn("Failed to showNotification via SW ready", err);
                    sendFallbackNotification();
                  });
                } else {
                  sendFallbackNotification();
                }
              }).catch(() => {
                sendFallbackNotification();
              });
            }
          }).catch((err) => {
            console.warn("Failed to get SW registration, falling back", err);
            sendFallbackNotification();
          });
        } else {
          sendFallbackNotification();
        }
      }, 8000);
    }

    return {
      success: true,
      toast: {
        title: "Academic alerts enabled ✅",
        body: "Nexus will notify you about important attendance and marks updates."
      }
    };
  } else {
    // If permission was denied or default
    store.setAcademicAlertsEnabled(false);
    store.setAcademicAlertsPrompted(true);

    localStorage.setItem("academicAlertsEnabled", "false");
    localStorage.setItem("academicAlertsPrompted", "true");

    return {
      success: false,
      toast: {
        title: "Notifications are off",
        body: "You can enable academic alerts later in Profile."
      }
    };
  }
}
