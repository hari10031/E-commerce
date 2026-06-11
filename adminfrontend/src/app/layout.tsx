import type { Metadata } from 'next';
import { BRAND } from '@/lib/brand';
import './globals.css';
import { Toaster } from '@/components/ui/toast';

export const metadata: Metadata = {
  title: `${BRAND.name} Admin`,
  description: `${BRAND.name} Admin Dashboard`,
  icons: { icon: BRAND.logoPath, apple: BRAND.logoPath },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
