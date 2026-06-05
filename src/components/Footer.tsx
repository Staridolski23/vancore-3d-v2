'use client';

const navLinks = [
  { href: '#проблеми', label: 'Проблеми' },
  { href: '#методология', label: 'Методология' },
  { href: '#анализ', label: 'AI Анализ' },
  { href: '#услуги', label: 'Услуги' },
  { href: '#екип', label: 'Екип' },
  { href: '#контакт', label: 'Контакт' },
];

export default function Footer() {
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
              <a key={link.href} href={link.href} className="hover:text-vancore-bronze transition-colors">{link.label}</a>
            ))}
          </div>
          <div className="text-xs text-vancore-muted">© 2026 VANCORE. Всички права запазени.</div>
        </div>
      </div>
    </footer>
  );
}
