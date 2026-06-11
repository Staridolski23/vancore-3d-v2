'use client';

import { useState, useEffect } from 'react';

const SECTION_LABELS: Record<string, string> = {
  hero: 'Hero',
  services: 'Услуги',
  methodology: 'Методология',
  industries: 'Отрасли',
  team: 'Екип',
  contact: 'Контакт',
  chat: 'AI Анализ',
};

const DEFAULT_SECTIONS = [
  { id: 'hero', text: 'Намерете счупените звена във вашия бизнес' },
  { id: 'services', text: 'Какво анализираме' },
  { id: 'methodology', text: 'Нашата Методология' },
  { id: 'industries', text: 'Целеви отрасли' },
  { id: 'team', text: 'Отборът зад VANCORE' },
  { id: 'contact', text: 'Започнете промяната' },
  { id: 'chat', text: 'БЕЗПЛАТЕН AI АНАЛИЗ' },
];

export default function AdminEditor() {
  const [sections, setSections] = useState(DEFAULT_SECTIONS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch('/api/admin/sections')
      .then((r) => r.json())
      .then((d) => {
        if (d.sections && typeof d.sections === 'object') {
          const arr = Object.entries(d.sections).map(([id, v]: [string, unknown]) => ({
            id,
            text: typeof v === 'object' && v !== null && 'text' in v ? String((v as { text: unknown }).text || '') : String(v || ''),
          }));
          if (arr.length > 0) setSections(arr);
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (!selectedId && sections.length > 0) {
      setSelectedId(sections[0].id);
      setText(sections[0].text || '');
    }
  }, [loaded, sections, selectedId]);

  const selectSection = (id: string) => {
    const sec = sections.find((s) => s.id === id);
    if (!sec) return;
    setSelectedId(id);
    setText(sec.text || '');
  };

  const save = async () => {
    if (!selectedId) return;
    setSaving(true);
    setStatus('Запазване...');
    try {
      const res = await fetch('/api/admin/sections', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedId, text }),
      });
      if (res.ok) {
        setStatus('✅ Запазено!');
        setSections((prev) => prev.map((s) => (s.id === selectedId ? { ...s, text } : s)));
      } else {
        setStatus('❌ Грешка при запазване');
      }
    } catch {
      setStatus('❌ Грешка');
    } finally {
      setSaving(false);
    }
  };

  const selectedLabel = selectedId ? SECTION_LABELS[selectedId] || selectedId : '';

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">🎨 Редактор на сайта</h2>
      <p className="text-sm text-gray-400">Редакрай текстовете на секциите. Промените се запазват в базата данни.</p>

      {status && (
        <div className={`rounded px-3 py-2 text-sm ${status.includes('✅') ? 'bg-green-900/30 text-green-400' : status.includes('❌') ? 'bg-red-900/30 text-red-400' : 'bg-white/5 text-gray-400'}`}>
          {status}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-4">
        <aside className="rounded-lg border border-white/10 bg-white/5 p-3">
          <h3 className="text-xs font-semibold mb-2 text-gray-400 uppercase">Секции</h3>
          <div className="space-y-1">
            {sections.map((sec) => (
              <button
                key={sec.id}
                onClick={() => selectSection(sec.id)}
                className={`w-full text-left rounded px-2 py-2 text-sm ${
                  selectedId === sec.id ? 'bg-yellow-600 text-black font-semibold' : 'bg-white/5 hover:bg-white/10'
                }`}
              >
                {SECTION_LABELS[sec.id] || sec.id}
              </button>
            ))}
          </div>
        </aside>

        <section className="rounded-lg border border-white/10 bg-white/5 p-4">
          {selectedId ? (
            <div className="space-y-3">
              <h3 className="font-semibold">{selectedLabel}</h3>
              <textarea
                className="w-full h-48 rounded bg-black/40 border border-white/10 p-3 text-sm text-white resize-y"
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
              <button
                onClick={save}
                disabled={saving}
                className="px-5 py-2 rounded bg-yellow-600 text-black font-semibold text-sm disabled:opacity-50"
              >
                {saving ? 'Запазване...' : '💾 Запази'}
              </button>
            </div>
          ) : (
            <p className="text-sm text-gray-400">Избери секция отляво.</p>
          )}
        </section>
      </div>
    </div>
  );
}
