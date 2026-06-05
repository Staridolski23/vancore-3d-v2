import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ThreeScene from '@/components/ThreeScene';

export const metadata: Metadata = {
  title: 'VANCORE — AI-подпомогнат бизнес анализ',
  description: 'Намерете счупеното звено във вашия бизнес.',
};

export default function RootLayout({
  children,
}: { children: React.ReactNode }) {
  return (
    <html lang="bg" className="scroll-smooth">
      <body>
        <ThreeScene />
        <div className="content-layer">
          <Header />
          {children}
          <Footer />
        </div>
      </body>
    </html>
  );
}
