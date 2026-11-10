import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import hero_img from "@/assets/hero.png";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Full Calendar",
  description:
    "A full-featured calendar component built with Next.js and Shadcn UI that supports multiple views, event management, and responsive design.",
  keywords: [
    "calendar",
    "nextjs",
    "shadcn",
    "react",
    "typescript",
    "full calendar",
  ],
  authors: [{ name: "Jeraidi Yassir", url: "https://jeraidi.tech" }],
  creator: "Jeraidi Yassir",
  applicationName: "Full Calendar",
  openGraph: {
    title: "Full Calendar",
    description:
      "A full-featured calendar component built with Next.js and Shadcn UI.",
    url: "https://calendar.jeraidi.tech/",
    type: "website",
    siteName: "Full calendar",
    images: [{ url: hero_img.src }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Full Calendar",
    description:
      "A full-featured calendar component built with Next.js and Shadcn UI.",
  },
  robots: {
    index: true,
    follow: true,
  },
  generator: "Next.js",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster richColors closeButton position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}
