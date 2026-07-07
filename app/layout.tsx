import type { Metadata } from 'next';
import './globals.css';
import ViewportFix from '@/components/ViewportFix';
import AgeGateModal from '@/components/AgeGateModal';
import { SITE_URL } from '@/lib/site';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
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
        <AgeGateModal />
        <ViewportFix />
        {children}
      </body>
    </html>
  );
}