import type { Metadata } from 'next';
import '../globals.css';

export const metadata: Metadata = {
  title: 'VANCORE Admin',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bg">
      <body className="bg-vancore-dark text-vancore-light antialiased">{children}</body>
    </html>
  );
}
