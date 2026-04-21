import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import Providers from "./providers";
import SwipeLayout from "@/components/SwipeLayout";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const orbitron = localFont({
  src: "https://fonts.gstatic.com/s/orbitron/v31/yHQd1kWHMIlsjP6t0KjweXFk.woff2",
  variable: "--font-orbitron",
  display: "swap",
  fallback: ["monospace"],
});

const playfair = localFont({
  src: "https://fonts.gstatic.com/s/playfairdisplay/v37/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKdFvXDXbtM.woff2",
  variable: "--font-playfair",
  display: "swap",
  fallback: ["serif"],
});

const bebas = localFont({
  src: "https://fonts.gstatic.com/s/bebasneue/v14/JTUSjIg69CK48gW7PXoo9WlhyyTh89Y.woff2",
  variable: "--font-bebas",
  display: "swap",
  fallback: ["sans-serif"],
});

export const metadata: Metadata = {
  title: "SRMX — Student Portal",
  description: "Modern SRM University student portal — Attendance, Marks, Timetable & more",
  icons: {
    icon: "/favicon.ico",
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
      <body style={{ margin: 0, padding: 0, fontFamily: "var(--font-inter), system-ui, sans-serif" }}>
        <Providers>
          <SwipeLayout>{children}</SwipeLayout>
        </Providers>
      </body>
    </html>
  );
}
