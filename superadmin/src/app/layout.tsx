import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'S-Box Platform Console',
  description: 'Gemini AI quota management',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
