import type { Metadata, Viewport } from 'next';
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';
import { BottomNav } from '@/components/bottom-nav';

export const metadata: Metadata = {
  title: 'Fiado',
  description: 'Gerenciador de fiados',
  manifest: '/manifest.json',
  icons: {
    icon: 'https://i.imgur.com/Q3ZZ6SV.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#212121',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className={cn('font-body antialiased')}>
        <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col bg-background">
          <main className="flex-1">{children}</main>
          <BottomNav />
        </div>
        <Toaster />
      </body>
    </html>
  );
}
