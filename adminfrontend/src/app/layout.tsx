import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toast';

export const metadata: Metadata = {
  title: 'NanaBanana Admin',
  description: 'NanaBanana Admin Dashboard',
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
