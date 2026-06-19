'use client';

import { useState, useEffect, useRef } from 'react';

import RichTextEditor from '@/components/RichTextEditor';
import SectionCarousel from '@/components/SectionCarousel';

const SECTION_LABELS: Record<string, string> = {
  hero: 'Hero',
  services: 'Services',
  methodology: 'Methodology',
  industries: 'Industries',
  team: 'Team',
  contact: 'Contact',
  chat: 'AI Analyst',
  footer: 'Footer',
};

const API = '';

const PAGE_TYPE_IDS = new Set<string>();

const DEFAULT_SECTIONS_DICT: Record<string, { title: string; subtitle: string; type?: string; body?: string; slides?: { id: string; title?: string; subtitle?: string; image?: string }[] }> = {
  hero: { title: 'The biggest operational gaps we fix', subtitle: 'Business analysis, AI diagnostics, and delivery.', type: 'hero', body: '<p>Use this area for formatted editor content.</p>' },
  services: { title: 'What we analyse', subtitle: '10 core business aspects', type: 'services', body: '' },
  methodology: { title: 'Our methodology', subtitle: 'Step by step', type: 'methodology', body: '' },
  industries: { title: 'Industries', subtitle: 'Focus sectors', type: 'industries', body: '' },
  team: { title: 'The team behind VANCORE', subtitle: 'People and agents', type: 'team', body: '' },
  contact: { title: 'Start the change', subtitle: 'Write to us', type: 'contact', body: '' },
  chat: { title: 'FREE AI ANALYSIS', subtitle: 'Describe your problem', type: 'chat', body: '' },
  footer: { title: 'Footer', subtitle: 'Additional information', type: 'footer', body: '<p>© 2026 VANCORE</p>' },
};

type AdminView = 'dashboard' | 'leads' | 'cases' | 'sessions' | 'inbox' | 'calendar' | 'analysis' | 'activity' | 'editor';

type AdminSection = {
  title: string;
  subtitle: string;
  type?: string;
  styles?: Record<string, any>;
  body?: string;
  slides?: { id: string; title?: string; subtitle?: string; image?: string }[];
};

export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [view, setView] = useState<AdminView>('dashboard');
  const [error, setError] = useState('');

  // Editor state
  const [sections, setSections] = useState<Record<string, AdminSection>>(DEFAULT_SECTIONS_DICT as any);
  const [order, setOrder] = useState<string[]>(Object.keys(DEFAULT_SECTIONS_DICT));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editSubtitle, setEditSubtitle] = useState('');
  const [editBody, setEditBody] = useState('');
  const [slides, setSlides] = useState<{ id: string; title?: string; subtitle?: string; image?: string }[]>([]);
  const [media, setMedia] = useState<{ id: string; url: string; type: 'image' | 'video'; caption?: string }[]>([]);
  const [footerText, setFooterText] = useState('© 2026 VANCORE');
  const [contactEmail, setContactEmail] = useState('office@vancore.bg');
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [previewToken, setPreviewToken] = useState<string | null>(null);
  const [undoStack, setUndoStack] = useState<any[]>([]);
  const [redoStack, setRedoStack] = useState<any[]>([]);

  const [stats, setStats] = useState({ leads: 0, leads_week: 0, sessions: 0, cases: 0, users: 0, meetings: 0, activities: 0 });

  useEffect(() => {
    const prev = typeof window !== 'undefined' ? window.localStorage.getItem('vancore_admin_user') : null;
    if (prev) {
      setIsLoggedIn(true);
      try { setUser(JSON.parse(prev)); } catch {}
    }
    const url = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    if (url?.get('view') === 'editor') setView('editor');
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      loadStats();
      if (view === 'editor') loadContent();
    }
  }, [isLoggedIn, view]);

  const rebuildStacks = (nextSections: Record<string, AdminSection>, nextOrder: string[]) => {
    const current = { sections, order };
    setUndoStack((prev) => {
      const next = [...prev, current];
      return next.length > 40 ? next.slice(-40) : next;
    });
    setRedoStack([]);
    setSections(nextSections);
    setOrder(nextOrder);
  };

  const undo = () => {
    if (!undoStack.length) return;
    const prev = undoStack[undoStack.length - 1];
    setRedoStack((r) => [...r, { sections, order }]);
    setSections(prev.sections || {});
    setOrder(prev.order || []);
    setUndoStack((u) => u.slice(0, -1));
    setStatus('↶ Undo');
  };

  const redo = () => {
    if (!redoStack.length) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack((u) => [...u, { sections, order }]);
    setSections(next.sections || {});
    setOrder(next.order || []);
    setRedoStack((r) => r.slice(0, -1));
    setStatus('↷ Redo');
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const meta = e.ctrlKey || e.metaKey;
      if (meta && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if ((meta && e.key.toLowerCase() === 'y') || (meta && e.shiftKey && e.key.toLowerCase() === 'z')) {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undoStack, redoStack, sections, order]);

  const loadStats = async () => {
    try {
      const res = await fetch(`${API}/api/admin/stats`, { credentials: 'include' });
      if (res.ok) setStats(await res.json());
    } catch {}
  };

  const loadContent = async () => {
    try {
      const res = await fetch(`${API}/api/admin/sections`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (data.sections) setSections(data.sections as Record<string, AdminSection>);
        if (data.order?.length) setOrder(data.order);
      }
    } catch {}
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch(`${API}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok || !data?.user) {
        setError(data?.error || 'Invalid email or password.');
        return;
      }
      setUser(data.user);
      setIsLoggedIn(true);
      window.localStorage.setItem('vancore_admin_user', JSON.stringify(data.user));
      setEmail('');
      setPassword('');
    } catch {
      setError('Login failed.');
    }
  };

  const logout = async () => {
    try { await fetch(`${API}/api/admin/logout`, { method: 'POST', credentials: 'include' }); } catch {}
    setIsLoggedIn(false);
    setUser(null);
    window.localStorage.removeItem('vancore_admin_user');
  };

  const selectSection = (id: string) => {
    setSelectedId(id);
    const sec = sections[id] || DEFAULT_SECTIONS_DICT[id] || { title: '', subtitle: '' };
    setEditTitle(sec.title || '');
    setEditSubtitle(sec.subtitle || '');
    setEditBody((sec as any).body || '');
    setSlides((sec as any).slides || []);
    setFooterText((sec as any).footerText || '© 2026 VANCORE');
    setContactEmail((sec as any).contactEmail || 'office@vancore.bg');
  };

  const saveSection = async () => {
    if (!selectedId) return;
    setSaving(true);
    setStatus('Saving...');
    try {
      const res = await fetch(`${API}/api/admin/sections/${selectedId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ title: editTitle, subtitle: editSubtitle, body: editBody, slides, media, footerText, contactEmail }),
      });
      if (res.ok) {
        const nextSections = { ...sections, [selectedId]: { ...(sections[selectedId] || {}), title: editTitle, subtitle: editSubtitle, body: editBody, slides, media, footerText, contactEmail } };
        rebuildStacks(nextSections, order);
        setStatus('Saved');
      } else {
        setStatus('Save failed');
      }
    } catch {
      setStatus('Error');
    } finally {
      setSaving(false);
    }
  };

  const reorderSections = async (next: string[]) => {
    try {
      const res = await fetch(`${API}/api/admin/sections/reorder`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ order: next }),
      });
      if (res.ok) {
        rebuildStacks(sections, next);
        setStatus('Section order updated');
      } else {
        setStatus('Could not update section order');
      }
    } catch {
      setStatus('Reorder failed');
    }
  };

  const addSection = async () => {
    const id = `custom-${Date.now()}`;
    const title = 'New Section';
    const subtitle = '';
    try {
      const res = await fetch(`${API}/api/admin/sections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id, type: 'custom', title, subtitle }),
      });
      if (res.ok) {
        const nextSections = { ...sections, [id]: { title, subtitle, type: 'custom' } };
        const nextOrder = [...order, id];
        rebuildStacks(nextSections, nextOrder);
        setSelectedId(id);
        setEditTitle(title);
        setEditSubtitle(subtitle);
        setStatus('✅ Секцията е добавена');
      } else {
        setStatus('❌ Не успя да добави секция');
      }
    } catch {
      setStatus('❌ Грешка при добавяне');
    }
  };

  const deleteSection = async (id: string) => {
    if (!id) return;
    if (!window.confirm('Сигурни ли сте, че искате да изтриете тази секция?')) return;
    try {
      const res = await fetch(`${API}/api/admin/sections/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        const nextSections = { ...sections };
        delete nextSections[id];
        const nextOrder = order.filter((x) => x !== id);
        rebuildStacks(nextSections, nextOrder);
        if (selectedId === id) setSelectedId(null);
        setStatus('✅ Секцията е изтрита');
      } else {
        setStatus('❌ Не успя да изтрие секция');
      }
    } catch {
      setStatus('❌ Грешка при изтриване');
    }
  };

  const exportPreview = () => {
    const previewHtml = `<!DOCTYPE html>
<html lang="bg">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>VANCORE Preview</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet" />
  <style>
    :root { --button-color: ${sections[selectedId || '']?.styles?.buttonColor || '#d4af37'}; --heading-font: ${sections[selectedId || '']?.styles?.headingFont || 'Bodoni Cyrillic, serif'}; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', sans-serif; background: #0b0c10; color: #fff; }
    .section { padding: 60px 20px; max-width: 1100px; margin: 0 auto; }
    h1, h2, h3 { font-family: var(--heading-font); }
    .btn { background: var(--button-color); color: #000; padding: 10px 20px; border-radius: 6px; font-weight: 600; }
  </style>
</head>
<body>
  ${(order || []).map((id) => {
    const sec = sections[id] || {};
    return `<section class="section"><h2>${sec.title || ''}</h2><p>${sec.subtitle || ''}</p></section>`;
  }).join('\n')}
</body>
</html>`;
    const blob = new Blob([previewHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank', 'width=1200,height=800');
  };

  const syncLiveSite = async () => {
    try {
      const res = await fetch(`${API}/api/admin/content`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ sections, order }),
      });
      if (res.ok) setStatus('✅ Синхронизирано с живото съдържание');
      else setStatus('❌ Неуспешна синхронизация');
    } catch {
      setStatus('❌ Грешка при синхронизация');
    }
  };

  const updateSlide = (index: number, patch: Partial<{ title: string; subtitle: string; image: string }>) => {
    setSlides((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...patch };
      return next;
    });
  };

  const addSlide = () => {
    setSlides((prev) => [...prev, { id: `slide-${Date.now()}`, title: 'Нов слайд', subtitle: '', image: '' }]);
  };

  const removeSlide = (index: number) => {
    setSlides((prev) => prev.filter((_, i) => i !== index));
  };

  const addMediaByUrl = () => {
    const url = prompt('Въведи URL на изображение или видео');
    if (!url) return;
    const item: { id: string; type: 'image' | 'video'; url: string } = {
      id: `media-${Date.now()}`,
      type: url.match(/\.(mp4|webm|ogg)(\?|$)/i) ? 'video' : 'image',
      url,
    };
    setMedia((prev) => [...prev, item]);
  };

  const updateMedia = (index: number, patch: { url?: string; caption?: string }) => {
    setMedia((prev) => { const next = [...prev]; next[index] = { ...next[index], ...patch }; return next;});
  };
  const removeMedia = (index: number) => setMedia((prev) => prev.filter((_, i) => i !== index));

  const addPage = () => {
    const id = `page-${Date.now()}`;
    const nextOrder = [...order, id];
    const nextSections = { ...sections, [id]: { title: 'Нова страница', subtitle: '', type: 'page', body: '', slides: [], media: [] } };
    rebuildStacks(nextSections, nextOrder);
    setSelectedId(id);
  };

  const renamePage = (id: string, title: string) => {
    setSections((prev) => ({ ...prev, [id]: { ...(prev[id] || {}), title } }));
  };

  const deletePage = (id: string) => {
    if (!window.confirm('Изтриваш страница. Сигурен?')) return;
    const next = { ...sections }; delete next[id];
    const nextOrder = order.filter((x) => x !== id);
    rebuildStacks(next, nextOrder);
    if (selectedId === id) setSelectedId(null);
  };

  const selectedSection = sections[selectedId || ''] || null;

  const nav: { id: AdminView; label: string; icon: string }[] = [
    { id: 'dashboard', label: 'Табло', icon: '🏠' },
    { id: 'leads', label: 'Лийдове', icon: '👥' },
    { id: 'cases', label: 'Казуси', icon: '📋' },
    { id: 'sessions', label: 'AI Сесии', icon: '💬' },
    { id: 'inbox', label: 'Входящи', icon: '📥' },
    { id: 'calendar', label: 'Календар', icon: '📅' },
    { id: 'analysis', label: 'Анализ', icon: '📊' },
    { id: 'activity', label: 'Дейности', icon: '📋' },
    { id: 'editor', label: 'Редактор', icon: '🎨' },
  ];

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-[#0b0c10]">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-400 flex items-center justify-center text-black text-2xl font-bold mx-auto mb-4">V</div>
            <h1 className="text-2xl font-bold text-white">VANCORE Admin</h1>
            <p className="text-gray-400 text-sm mt-1">Само за екип</p>
          </div>
          <form onSubmit={handleLogin} className="rounded-2xl p-6 border border-amber-500/20 bg-white/5 space-y-4">
            <div>
              <label className="block text-xs text-gray-400 mb-2">Имейл</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/40" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-2">Парола</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/40" />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button type="submit" className="w-full py-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-semibold">Вход</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0c10] text-white">
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#0b0c10]/80 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-yellow-400 flex items-center justify-center text-black text-xs font-bold">V</div>
            <span className="font-bold text-sm tracking-wider">VAN<span className="text-amber-500">CORE</span> Admin</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-400">{user?.name}</span>
            <button onClick={logout} className="text-xs text-gray-400 hover:text-amber-500">Изход</button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <nav className="flex flex-wrap gap-2 mb-8">
          {nav.map((item) => (
            <button key={item.id} onClick={() => setView(item.id)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${view === item.id ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black' : 'bg-white/5 text-gray-400 hover:text-white'}`}>
              <span className="mr-2">{item.icon}</span>{item.label}
            </button>
          ))}
        </nav>

        <div className="space-y-6">
          {view === 'dashboard' && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Лийдове', value: stats.leads },
                { label: 'Нови седмицата', value: stats.leads_week },
                { label: 'AI Сесии', value: stats.sessions },
                { label: 'Казуси', value: stats.cases },
                { label: 'Потребители', value: stats.users },
                { label: 'Срещи', value: stats.meetings },
                { label: 'Дейности', value: stats.activities },
              ].map((s) => (
                <div key={s.label} className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="text-2xl font-bold">{s.value}</div>
                  <div className="text-xs text-gray-400 mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          )}

          {view === 'editor' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">🎨 Редактор на сайта</h2>
                  <p className="text-sm text-gray-400 mt-1">Редактирай подредба, стилове и съдържание на секциите.</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={loadContent} className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm">🔄 Презареди</button>
                  <button onClick={exportPreview} className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm">👁 Preview</button>
                  <button onClick={syncLiveSite} className="px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 text-sm">🚀 Синхронизирай</button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button onClick={undo} disabled={!undoStack.length} className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm disabled:opacity-30 disabled:cursor-not-allowed">↶ Undo</button>
                <button onClick={redo} disabled={!redoStack.length} className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm disabled:opacity-30 disabled:cursor-not-allowed">↷ Redo</button>
                <div className="ml-auto flex items-center gap-2">
                  <button onClick={() => setPreviewMode('desktop')} className={`px-3 py-2 rounded-lg text-sm ${previewMode === 'desktop' ? 'bg-amber-500 text-black' : 'bg-white/5'}`}>🖥 Desktop</button>
                  <button onClick={() => setPreviewMode('mobile')} className={`px-3 py-2 rounded-lg text-sm ${previewMode === 'mobile' ? 'bg-amber-500 text-black' : 'bg-white/5'}`}>📱 Mobile</button>
                </div>
              </div>

              {status && (
                <div className={`rounded-lg border px-4 py-2 text-sm ${status.includes('✅') ? 'border-green-500/30 bg-green-500/10 text-green-400' : status.includes('❌') ? 'border-red-500/30 bg-red-500/10 text-red-400' : 'border-white/10 bg-white/5 text-gray-400'}`}>{status}</div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-4">
                <aside className="rounded-lg border border-white/10 bg-white/5 p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase">Страници</h3>
                    <button onClick={addPage} className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-300 text-xs">+ Страница</button>
                  </div>
                  <div className="space-y-1">
                    {order.map((id, idx) => (
                      <div key={id} className="flex items-center gap-2">
                        <button
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData('text/plain', id);
                            e.dataTransfer.effectAllowed = 'move';
                          }}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => {
                            e.preventDefault();
                            const from = e.dataTransfer.getData('text/plain');
                            if (!from || from === id) return;
                            const next = order.filter((x) => x !== from);
                            const insertAt = order.indexOf(id);
                            next.splice(insertAt, 0, from);
                            reorderSections(next);
                          }}
                          className="w-6 text-center text-xs text-gray-400 select-none"
                          aria-label="Преди"
                        >☰</button>
                        <button
                          onClick={() => selectSection(id)}
                          className={`w-full text-left rounded px-2 py-2 text-sm flex items-center justify-between gap-2 ${selectedId === id ? 'bg-yellow-500 text-black font-semibold' : 'bg-white/5 hover:bg-white/10'}`}
                        >
                          <span>{SECTION_LABELS[id] || id}</span>
                          <div className="flex items-center gap-1">
                            <input
                              className="w-20 rounded bg-black/30 border border-white/10 px-1 py-0.5 text-[10px] text-white"
                              value={sections[id]?.title || ''}
                              onChange={(e) => renamePage(id, e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <button
                              onClick={(e) => { e.stopPropagation(); deletePage(id); }}
                              className="text-xs text-red-300 hover:text-red-400"
                            >🗑</button>
                          </div>
                        </button>
                      </div>
                    ))}
                  </div>
                </aside>

                <section className={`rounded-lg border border-white/10 bg-white/5 p-4 transition-all ${previewMode === 'mobile' ? 'max-w-sm' : ''}`}>
                  {selectedSection ? (
                    <div className="space-y-3">
                      <h3 className="font-semibold text-lg">{SECTION_LABELS[selectedId || ''] || selectedId}</h3>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Заглавие</label>
                        <input className="w-full rounded bg-black/40 border border-white/10 px-3 py-2 text-sm text-white" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Съдържание</label>
                        <RichTextEditor value={editBody} onChange={setEditBody} placeholder="Свободен текст за секцията..." />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Цвят на бутони</label>
                          <input type="color" className="w-full h-9 rounded bg-black/40 border border-white/10" value={selectedSection?.styles?.buttonColor || '#d4af37'} onChange={async (e) => {
                            const next = { ...(selectedSection?.styles || {}), buttonColor: e.target.value };
                            setSections((prev) => ({ ...prev, [selectedId as string]: { ...(prev[selectedId as string] || {}), styles: next } }));
                            await fetch(`${API}/api/admin/sections/${selectedId}/styles`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ styles: next }) });
                          }} />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Шрифт на заглавия</label>
                          <select className="w-full rounded bg-black/40 border border-white/10 px-3 py-2 text-sm text-white" value={selectedSection?.styles?.headingFont || 'Bodoni Cyrillic'} onChange={async (e) => {
                            const next = { ...(selectedSection?.styles || {}), headingFont: e.target.value };
                            setSections((prev) => ({ ...prev, [selectedId as string]: { ...(prev[selectedId as string] || {}), styles: next } }));
                            await fetch(`${API}/api/admin/sections/${selectedId}/styles`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ styles: next }) });
                          }}>
                            <option>Bodoni Cyrillic</option>
                            <option>Inter</option>
                            <option>Roboto</option>
                          </select>
                        </div>
                      </div>
                      <button onClick={saveSection} disabled={saving} className="px-5 py-2 rounded bg-yellow-500 text-black font-semibold text-sm disabled:opacity-50">
                        {saving ? 'Запазване...' : '💾 Запази'}
                      </button>
                      <div className="rounded-lg border border-white/10 bg-white/5 p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-semibold text-gray-300">Медия (URL)</h4>
                          <button onClick={addMediaByUrl} className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-300 text-xs">+ Добави медия</button>
                        </div>
                        {media.map((item, index) => (
                          <div key={item.id} className="grid grid-cols-1 gap-1 rounded border border-white/10 bg-black/40 p-2">
                            <input className="w-full rounded bg-black/40 border border-white/10 px-2 py-1 text-xs text-white" placeholder="https://..." value={item.url} onChange={(e) => updateMedia(index, { url: e.target.value })} />
                            <input className="w-full rounded bg-black/40 border border-white/10 px-2 py-1 text-xs text-white" placeholder="Подпис (незадължително)" value={item.caption || ''} onChange={(e) => updateMedia(index, { caption: e.target.value })} />
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-gray-500">{item.type === 'video' ? '🎬 Видео' : '🖼 Снимка'}</span>
                              <button onClick={() => removeMedia(index)} className="text-[10px] text-red-300 hover:text-red-400">Премахни</button>
                            </div>
                          </div>
                        ))}
                        {!media.length && <p className="text-xs text-gray-500">Няма медия. Добави URL на снимка или видео.</p>}
                      </div>
                      <div className="grid grid-cols-1 gap-3">
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Footer текст</label>
                          <input className="w-full rounded bg-black/40 border border-white/10 px-3 py-2 text-sm text-white" value={footerText} onChange={(e) => setFooterText(e.target.value)} />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Контакт имейл</label>
                          <input className="w-full rounded bg-black/40 border border-white/10 px-3 py-2 text-sm text-white" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">👈 Избери секция отляво, за да редактираш съдържанието и стиловете.</p>
                  )}
                </section>
              </div>
            </div>
          )}

          {(view === 'leads' || view === 'cases' || view === 'sessions' || view === 'inbox' || view === 'calendar' || view === 'analysis' || view === 'activity') && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-6">
              <p className="text-gray-400 text-sm">Секцията "{view}" се зарежда от сървъра. Данните ще се появят след зареждане.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
