import type { Metadata, Viewport } from "next";
import { Inter, Orbitron, Playfair_Display, Bebas_Neue, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import SwipeLayout from "@/components/SwipeLayout";
import ThemeWrapper from "@/components/ThemeWrapper";
import AppLaunchSplash from "@/components/AppLaunchSplash";
import BroadcastBanner from "@/components/BroadcastBanner";
import JsonLd from "@/components/seo/JsonLd";
import InstallPWA from "@/components/InstallPWA";
import AttendanceBadge from "@/components/AttendanceBadge";
import CacheUpgrade from "@/components/CacheUpgrade";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const jakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jakarta",
  weight: ["400", "500", "600", "700", "800"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jetbrains",
  weight: ["400", "700"],
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
  title: "SRM Nexus — The Ultimate SRM Academia Student Portal",
  description: "Experience SRM Nexus, the definitive SRM Academia student portal. Track attendance, internal marks, timetable, and SGPA with precision. The ultimate Nexus Academia interface for SRM University students.",
  applicationName: "SRM Nexus",
  keywords: ["nexus academia", "srm nexus", "srm academia", "srm student portal", "srm attendance tracker", "srm timetable", "srm internal marks", "srmist portal"],
  authors: [{ name: "SRM Nexus Team" }],
  openGraph: {
    title: "SRM Nexus — The Ultimate SRM Academia Student Portal",
    description: "The definitive student portal for SRM University. Fast, elegant, and intelligent. Track attendance, marks, and timetable on SRM Nexus.",
    url: "https://srmnexus.app",
    siteName: "SRM Nexus",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SRM Nexus — The Ultimate SRM Academia Student Portal",
    description: "The definitive student portal for SRM University. Track attendance, marks, and timetable with SRM Nexus.",
  },
  manifest: "/site.webmanifest?v=4",
  appleWebApp: {
    capable: true,
    title: "SRM Nexus",
    statusBarStyle: "black-translucent",
  },
  other: {
    "apple-mobile-web-app-title": "SRM Nexus",
  },
  icons: {
    icon: "/nexus-logo.png",
    apple: "/nexus-logo.png",
  },
  alternates: {
    canonical: "https://srmnexus.app",
  },
};

export const viewport: Viewport = {
  themeColor: "#050505",
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 5,      // Allow pinch-zoom for accessibility
  userScalable: true,
  viewportFit: "cover", // Fills iPhone notch / Dynamic Island / Android camera cutouts
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jakartaSans.variable} ${jetbrainsMono.variable} ${orbitron.variable} ${playfair.variable} ${bebas.variable}`}>
      <body style={{ margin: 0, padding: 0 }}>
        <style>{`
          body:has(.nexus-splash) .srmx-top-status-bar,
          body:has(.nexus-splash) .srmx-mobile-nav,
          body:has(.nexus-splash) .desktop-sidebar {
            display: none !important;
          }
        `}</style>
        <JsonLd />
        <Providers>
          <ThemeWrapper>
            <CacheUpgrade />
            <AppLaunchSplash>
              <BroadcastBanner />
              <InstallPWA />
              <AttendanceBadge />
              <SwipeLayout>{children}</SwipeLayout>
            </AppLaunchSplash>
          </ThemeWrapper>
        </Providers>
      </body>
    </html>
  );
}
