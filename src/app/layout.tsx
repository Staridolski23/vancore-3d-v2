import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ThreeScene from '@/components/ThreeScene';
import ChatBot from '@/components/ChatBot';
import { LanguageProvider } from '@/hooks/useLanguage';

export const metadata: Metadata = {
  title: 'VANCORE — AI-подпомогнат бизнес анализ',
  description: 'Намерете счупените звена във вашия бизнес.',
};

export default function RootLayout({
  children,
}: { children: React.ReactNode }) {
  return (
    <html lang="bg" className="scroll-smooth">
      <body>
        <ThreeScene />
        <LanguageProvider>
          <div className="content-layer">
            <Header />
            {children}
            <Footer />
          </div>
        </LanguageProvider>
      </body>
    </html>
  );
}
