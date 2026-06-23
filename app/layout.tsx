import type { Metadata } from 'next';
import './globals.css';
import ViewportFix from '@/components/ViewportFix';

export const metadata: Metadata = {
  title: 'Cocktail 3D Showcase',
  description: 'A premium 3D cocktail experience',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <ViewportFix />
        {children}
      </body>
    </html>
  );
}