import type { Metadata, Viewport } from "next";
import "./globals.css";
import LoggerSetup from "@/components/LoggerSetup";
import PerformanceMonitor from "@/components/PerformanceMonitor";
import DebugPanel from "@/components/DebugPanel";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import OfflineNotification from "@/components/OfflineNotification";
import CacheStatus from "@/components/CacheStatus";

export const metadata: Metadata = {
  title: "FinanceAnchor - Copiloto Financeiro",
  description: "Copiloto financeiro para casais - Controle de gastos, receitas e metas financeiras",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "FinanceAnchor",
  },
  formatDetection: {
    telephone: false,
  },
  keywords: ["finanças", "casais", "gastos", "receitas", "metas", "pwa"],
  authors: [{ name: "FinanceAnchor Team" }],
  openGraph: {
    title: "FinanceAnchor - Copiloto Financeiro",
    description: "Copiloto financeiro para casais - Controle de gastos, receitas e metas financeiras",
    type: "website",
    locale: "pt_BR",
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#003366",
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#003366" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="FinanceAnchor" />
        <meta name="msapplication-TileColor" content="#003366" />
        <meta name="msapplication-TileImage" content="/icon-192.png" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(registration) {
                      console.log('SW registered: ', registration);
                    })
                    .catch(function(registrationError) {
                      console.log('SW registration failed: ', registrationError);
                    });
                });
              }
            `,
          }}
        />
      </head>
      <body className="antialiased" suppressHydrationWarning>
        <LoggerSetup />
        <OfflineNotification />
        {children}
        <PerformanceMonitor />
        <DebugPanel />
        <PWAInstallPrompt />
        <CacheStatus />
      </body>
    </html>
  );
}
