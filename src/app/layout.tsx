import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'VANCORE — AI-Powered Business Analysis',
  description: 'A boutique business analysis consultancy. We help companies see clearly through their internal complexity — and act on what they find.',
  openGraph: {
    title: 'VANCORE — AI-Powered Business Analysis',
    description: 'A boutique business analysis consultancy. We help companies see clearly through their internal complexity — and act on what they find.',
    url: 'https://www.vancoresys.com',
    siteName: 'VANCORE',
    images: [
      {
        url: 'https://www.vancoresys.com/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'VANCORE — AI-Powered Business Analysis',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VANCORE — AI-Powered Business Analysis',
    description: 'A boutique business analysis consultancy. We help companies see clearly through their internal complexity.',
    images: ['https://www.vancoresys.com/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <body>
        <div className="content-layer">
          <Header />
          {children}
          <Footer />
        </div>
      </body>
    </html>
  );
}
