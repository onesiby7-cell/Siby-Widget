import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-geist' });

export const metadata: Metadata = {
  title: 'Siby Widget — Dashboard',
  description: 'Plateforme d\'agents IA pour sites web',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="dark">
      <body className={`${inter.variable} antialiased`}>{children}</body>
    </html>
  );
}
