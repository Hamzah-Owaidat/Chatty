import './globals.css';
import { Providers } from '../components/providers/providers';
import type { Metadata } from 'next';

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
    <html lang="en">
      <body className="bg-white text-black dark:bg-stone-950 dark:text-white max-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
