import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MirrorTV — Espelhar Celular para Smart TV",
  description:
    "App PWA para espelhar a tela do seu Android para qualquer Smart TV via Chromecast, DLNA/UPnP ou WebRTC peer-to-peer.",
  keywords: [
    "espelhar tela",
    "screen mirror",
    "smart tv",
    "chromecast",
    "dlna",
    "webrtc",
    "android",
    "pwa",
  ],
  authors: [{ name: "MirrorTV" }],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "MirrorTV",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icon-192.png", sizes: "192x192", type: "image/png" }],
  },
  openGraph: {
    title: "MirrorTV — Espelhar Celular para Smart TV",
    description:
      "Espelhe a tela do seu Android para qualquer Smart TV via Chromecast, DLNA ou WebRTC.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b0f1a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0b0f1a" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var t = localStorage.getItem('mirrortv-theme');
                  if (!t) t = 'dark';
                  document.documentElement.classList.toggle('dark', t === 'dark');
                  document.documentElement.style.colorScheme = t;
                } catch (e) {
                  document.documentElement.classList.add('dark');
                  document.documentElement.style.colorScheme = 'dark';
                }
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground min-h-screen`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          storageKey="mirrortv-theme"
        >
          {children}
          <Toaster />
          <SonnerToaster position="top-center" richColors closeButton />
        </ThemeProvider>
      </body>
    </html>
  );
}
