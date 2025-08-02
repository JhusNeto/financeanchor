import type { Metadata, Viewport } from "next";
import "./globals.css";
import LoggerSetup from "@/components/LoggerSetup";
import PerformanceMonitor from "@/components/PerformanceMonitor";
import DebugPanel from "@/components/DebugPanel";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import OfflineNotification from "@/components/OfflineNotification";
import CacheStatus from "@/components/CacheStatus";
import SplashScreen from "@/components/SplashScreen";
import HapticFeedback from "@/components/HapticFeedback";
import NativeGestures from "@/components/NativeGestures";
import PushNotifications from "@/components/PushNotifications";
import LoadingStates from "@/components/LoadingStates";

export const metadata: Metadata = {
  title: "FinanceAnchor - Copiloto Financeiro",
  description: "Copiloto financeiro para casais - Controle de gastos, receitas e metas financeiras",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "FinanceAnchor",
    startupImage: [
      {
        url: "/apple-touch-icon.png",
        media: "(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)",
      },
      {
        url: "/apple-touch-icon.png",
        media: "(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)",
      },
      {
        url: "/apple-touch-icon.png",
        media: "(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3)",
      },
    ],
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  keywords: ["finanças", "casais", "gastos", "receitas", "metas", "pwa", "app", "financeiro"],
  authors: [{ name: "FinanceAnchor Team" }],
  openGraph: {
    title: "FinanceAnchor - Copiloto Financeiro",
    description: "Copiloto financeiro para casais - Controle de gastos, receitas e metas financeiras",
    type: "website",
    locale: "pt_BR",
    url: "https://financeanchor.vercel.app",
    siteName: "FinanceAnchor",
    images: [
      {
        url: "/icon-512.png",
        width: 512,
        height: 512,
        alt: "FinanceAnchor Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "FinanceAnchor - Copiloto Financeiro",
    description: "Copiloto financeiro para casais - Controle de gastos, receitas e metas financeiras",
    images: ["/icon-512.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "your-google-verification-code",
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  minimumScale: 1,
  themeColor: "#003366",
  userScalable: false,
  viewportFit: "cover",
  colorScheme: "light",
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
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icon-192.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icon-192.png" />
        
        {/* Apple Touch Icons */}
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/apple-touch-icon.png" />
        
        {/* Meta tags para PWA */}
        <meta name="theme-color" content="#003366" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="FinanceAnchor" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="FinanceAnchor" />
        <meta name="msapplication-TileColor" content="#003366" />
        <meta name="msapplication-TileImage" content="/icon-192.png" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        
        {/* Preconnect para performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* DNS Prefetch */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//fonts.gstatic.com" />
        
        {/* Service Worker Registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(registration) {
                      console.log('SW registered: ', registration);
                      
                      // Verificar atualizações
                      registration.addEventListener('updatefound', () => {
                        const newWorker = registration.installing;
                        newWorker.addEventListener('statechange', () => {
                          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // Nova versão disponível
                            if (confirm('Nova versão disponível! Deseja atualizar?')) {
                              newWorker.postMessage({ type: 'SKIP_WAITING' });
                              window.location.reload();
                            }
                          }
                        });
                      });
                    })
                    .catch(function(registrationError) {
                      console.log('SW registration failed: ', registrationError);
                    });
                });
              }
              
              // Detectar se está instalado como PWA
              window.addEventListener('beforeinstallprompt', (e) => {
                console.log('PWA install prompt available');
              });
              
              // Detectar se foi instalado
              window.addEventListener('appinstalled', (e) => {
                console.log('PWA installed successfully');
              });
              
              // Configurar viewport para mobile
              if (window.innerWidth <= 768) {
                const viewport = document.querySelector('meta[name="viewport"]');
                if (viewport) {
                  viewport.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover');
                }
              }
            `,
          }}
        />
      </head>
      <body className="antialiased bg-gray-50" suppressHydrationWarning>
        <LoadingStates>
          <SplashScreen />
          <HapticFeedback>
            <NativeGestures>
              <LoggerSetup />
              <OfflineNotification />
              <div className="min-h-screen flex flex-col">
                {children}
              </div>
              <PerformanceMonitor />
              <DebugPanel />
              <PWAInstallPrompt />
              <PushNotifications />
              <CacheStatus />
            </NativeGestures>
          </HapticFeedback>
        </LoadingStates>
      </body>
    </html>
  );
}
