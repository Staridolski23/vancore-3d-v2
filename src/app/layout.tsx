import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CookieBanner from '@/components/CookieBanner';

export const metadata: Metadata = {
  title: 'VANCORE — AI-Powered Business Analysis',
  description: 'A boutique business analysis consultancy. We help companies see clearly through their internal complexity — and act on what they find.',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
  },
  openGraph: {
    title: 'VANCORE — AI-Powered Business Analysis',
    description: 'A boutique business analysis consultancy. We help companies see clearly through their internal complexity — and act on what they find.',
    url: 'https://www.vancoresys.com',
    siteName: 'VANCORE',
    images: [
      {
        url: '/og-image.svg',
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
    images: ['/og-image.svg'],
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
        <CookieBanner />
        {/* Tawk.to Live Chat */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
              (function(){
                var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
                s1.async=true;
                s1.src='https://embed.tawk.to/6a3e5336680a601d49f66f18/1js1na39r';
                s1.charset='UTF-8';
                s1.setAttribute('crossorigin','*');
                s0.parentNode.insertBefore(s1,s0);
              })();
            `,
          }}
        />
      </body>
    </html>
  );
}
