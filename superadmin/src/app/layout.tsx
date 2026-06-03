import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'S-Box Platform Console',
  description: 'Platform console — store admins and AI quota',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
