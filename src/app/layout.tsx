import type { Metadata } from 'next';
import { Suspense } from 'react';
import './globals.css';
import { Navbar } from '@/components/ui/Navbar';
import { TRPCReactProvider } from '@/lib/trpc/client';

export const metadata: Metadata = {
  title: 'devroast',
  description: 'DevRoast',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-page">
        <Suspense fallback={null}>
          <TRPCReactProvider>
            <Navbar />
            {children}
          </TRPCReactProvider>
        </Suspense>
      </body>
    </html>
  );
}
