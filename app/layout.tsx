import type { Metadata, Viewport } from "next";
import { Inter, Orbitron, Playfair_Display, Bebas_Neue } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import ThemeWrapper from "@/components/ThemeWrapper";
import JsonLd from "@/components/seo/JsonLd";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const orbitron = Orbitron({ subsets: ["latin"], variable: "--font-orbitron" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });
const bebas = Bebas_Neue({ weight: "400", subsets: ["latin"], variable: "--font-bebas" });

export const metadata: Metadata = {
  title: "SRM Nexus — The Ultimate SRM Academia Student Portal",
  description: "Track attendance, marks, and SGPA with the definitive Nexus Academia experience.",
  manifest: "/manifest.json",
  icons: {
    icon: "/nexus-logo.png",
    apple: "/nexus-logo.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#050505",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${orbitron.variable} ${playfair.variable} ${bebas.variable}`}>
      <body style={{ margin: 0, padding: 0, background: "#050505" }}>
        <JsonLd />
        <Providers>
          <ThemeWrapper>
             {children}
          </ThemeWrapper>
        </Providers>
      </body>
    </html>
  );
}
