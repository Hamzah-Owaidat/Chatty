import './globals.css';
import { Outfit } from 'next/font/google';
import { Providers } from '../components/providers/providers';
import type { Metadata } from 'next';

// The app's default font — self-hosted and eager-loaded for every visitor. The other nine
// Appearance fonts are plain Google Fonts, fetched on demand (see src/lib/fonts.ts) only
// once someone actually picks one.
const outfit = Outfit({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-outfit',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Chatty',
  description: 'Connect, chat and create meaningful conversations with Chatty.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={outfit.variable}>
      <body className="bg-white text-black dark:bg-stone-950 dark:text-white max-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
