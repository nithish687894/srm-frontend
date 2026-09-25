import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import SwipeLayout from "@/components/SwipeLayout";
import ThemeWrapper from "@/components/ThemeWrapper";
import AppLaunchSplash from "@/components/AppLaunchSplash";
import JsonLd from "@/components/seo/JsonLd";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const jakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jakarta",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jetbrains",
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "SRM Nexus — The Ultimate SRM Academia Student Portal",
  description: "Experience SRM Nexus, the definitive SRM Academia student portal. Track authoritative Student Portal attendance, component-wise internal marks, Day Order timetables, and SGPA with precision.",
  applicationName: "SRM Nexus",
  keywords: ["nexus academia", "srm nexus", "srm academia", "srm student portal", "srm attendance tracker", "srm timetable", "srm internal marks", "srmist portal", "srm nexus login"],
  authors: [{ name: "SRM Nexus Team" }],
  openGraph: {
    title: "SRM Nexus — The Ultimate SRM Academia Student Portal",
    description: "The definitive student portal for SRM University. Fast, elegant, and intelligent. Track attendance, marks, and timetable on SRM Nexus.",
    url: "https://srmnexus.app",
    siteName: "SRM Nexus",
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "https://srmnexus.app/og-image.png",
        width: 1200,
        height: 630,
        alt: "SRM Nexus — Unified Academic Workspace Logo",
        type: "image/png",
      },
      {
        url: "https://srmnexus.app/nexus-logo.png",
        width: 512,
        height: 512,
        alt: "SRM Nexus App Icon Logo",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SRM Nexus — The Ultimate SRM Academia Student Portal",
    description: "The definitive student portal for SRM University. Track attendance, marks, and timetable with SRM Nexus.",
    images: ["https://srmnexus.app/og-image.png"],
  },
  manifest: "/site.webmanifest",
  appleWebApp: {
    capable: true,
    title: "SRM Nexus",
    statusBarStyle: "black-translucent",
  },
  other: {
    "apple-mobile-web-app-title": "SRM Nexus",
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/nexus-logo.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon.svg",
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
    <html lang="en" suppressHydrationWarning className={`theme-lumina ${inter.variable} ${jakartaSans.variable} ${jetbrainsMono.variable}`}>
      <body className={`theme-lumina ${inter.className}`} style={{ margin: 0, padding: 0, background: "#09090F" }}>
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
            <AppLaunchSplash>
              <SwipeLayout>{children}</SwipeLayout>
            </AppLaunchSplash>
          </ThemeWrapper>
        </Providers>
      </body>
    </html>
  );
}
