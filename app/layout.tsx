import type { Metadata } from 'next';
import './globals.css';
import ViewportFix from '@/components/ViewportFix';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
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