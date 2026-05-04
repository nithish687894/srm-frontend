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
  title: "SRM NEXUS – Precision Academic Intelligence | SRM Student Portal",
  description: "The most advanced, high-performance interface for SRM students. Track attendance, internal marks, timetable, and SGPA with precision. Built for SRM University.",
  keywords: ["srmnexus", "srm nexus", "srm student portal", "srm attendance tracker", "srm sgpa calculator", "srm academia", "srmist portal"],
  authors: [{ name: "SRM Nexus Team" }],
  openGraph: {
    title: "SRM NEXUS – Precision Academic Intelligence",
    description: "The definitive student portal for SRM University. Fast, elegant, and intelligent.",
    url: "https://srmnexus.app",
    siteName: "SRM Nexus",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SRM NEXUS – Precision Academic Intelligence",
    description: "The definitive student portal for SRM University. Fast, elegant, and intelligent.",
  },
  manifest: "/site.webmanifest",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  alternates: {
    canonical: "https://srmnexus.app",
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
        <JsonLd />
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
