import type { Metadata, Viewport } from "next";
import { Inter, Orbitron, Playfair_Display, Bebas_Neue } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import SwipeLayout from "@/components/SwipeLayout";
import ThemeWrapper from "@/components/ThemeWrapper";
import AppLaunchSplash from "@/components/AppLaunchSplash";
import BroadcastBanner from "@/components/BroadcastBanner";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-orbitron",
  display: "swap",
  fallback: ["monospace"],
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
  fallback: ["serif"],
});

const bebas = Bebas_Neue({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-bebas",
  display: "swap",
  fallback: ["sans-serif"],
});

export const metadata: Metadata = {
  title: "SRM Nexus – Student Portal | Attendance, Marks, SGPA",
  description: "Fast SRM student portal for attendance, marks, timetable and SGPA tracking.",
  manifest: "/site.webmanifest",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#050505",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${orbitron.variable} ${playfair.variable} ${bebas.variable}`}>
      <body style={{ margin: 0, padding: 0 }}>
        <Providers>
          <ThemeWrapper>
            <AppLaunchSplash>
              <BroadcastBanner />
              <SwipeLayout>{children}</SwipeLayout>
            </AppLaunchSplash>
          </ThemeWrapper>
        </Providers>
      </body>
    </html>
  );
}
