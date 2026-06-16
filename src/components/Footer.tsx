'use client';

import { useLanguage } from '@/hooks/useLanguage';
import { useSiteContent } from '@/hooks/useSiteContent';

const navLinks = [
  { href: '#проблеми', labelKey: 'nav.problems' },
  { href: '#методология', labelKey: 'nav.methodology' },
  { href: '#анализ', labelKey: 'nav.analysis' },
  { href: '#услуги', labelKey: 'nav.services' },
  { href: '#екип', labelKey: 'nav.team' },
  { href: '#контакт', labelKey: 'nav.contact' },
];

export default function Footer() {
  const { t } = useLanguage();
  const { getFooter } = useSiteContent();
  const footer = getFooter();

  const copyright = footer.text || t('footer.copyright');
  const contactEmail = footer.contactEmail || 'office@vancore.bg';

  return (
    <footer className="relative py-12 border-t border-white/5 bg-vancore-dark/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-vancore-bronze to-vancore-gold flex items-center justify-center font-bold text-vancore-dark text-sm">V</div>
            <span className="text-sm font-bold tracking-wider">VAN<span className="gradient-text">CORE</span></span>
          </div>
          <div className="flex flex-wrap justify-center gap-6 text-xs text-vancore-muted">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} className="hover:text-vancore-bronze transition-colors">
                {t(link.labelKey)}
              </a>
            ))}
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="text-xs text-vancore-muted">{copyright}</div>
            <a href={`mailto:${contactEmail}`} className="text-xs text-vancore-bronze hover:text-vancore-gold transition-colors">{contactEmail}</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
