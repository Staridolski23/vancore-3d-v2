'use client';

import { useState, useEffect, useCallback } from 'react';

const SECTION_LABELS: Record<string, string> = {
  hero: 'Hero',
  services: 'Услуги',
  methodology: 'Методология',
  industries: 'Отрасли',
  team: 'Екип',
  contact: 'Контакт',
  chat: 'AI Анализ',
};

type SectionItem = { id: string; text: string };

export default function AdminEditor() {
  const [sections, setSections] = useState<SectionItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch('/api/admin/sections');
      const data = (await res.json().catch(() => ({ sections: [] }))) as { sections?: SectionItem[] };
      const items: SectionItem[] = Array.isArray(data.sections) ? data.sections : [];
      setSections(items);
      if (!selectedId && items.length > 0) {
        setSelectedId(items[0].id);
        setText(items[0].text || '');
      }
    } catch (err) {
      console.error(err);
      setStatus('Грешка при зареждане на секции');
    } finally {
      setLoading(false);
    }
  }, [selectedId]);

  useEffect(() => { load(); }, [load]);

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
      if (!res.ok) throw new Error('save failed');
      await load();
      setStatus('✅ Запазено успешно!');
    } catch (err) {
      console.error(err);
      setStatus('❌ Грешка при запазване');
    } finally {
      setSaving(false);
    }
  };

  const selectedLabel = selectedId ? SECTION_LABELS[selectedId] || selectedId : '';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">🎨 Редактор на сайта</h2>
          <p className="text-sm text-vancore-muted mt-1">Редакрай текстовете и съдържанието директно. Промените се запазват в Admin-данни.</p>
        </div>
        <button onClick={load} className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm">
          🔄 Презареди
        </button>
      </div>

      {status && (
        <div className={`rounded-lg border px-4 py-2 text-sm ${status.includes('✅') ? 'border-green-500/30 bg-green-500/10 text-green-400' : status.includes('❌') ? 'border-red-500/30 bg-red-500/10 text-red-400' : 'border-white/10 bg-white/5 text-vancore-muted'}`}>
          {status}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
        {/* Sidebar — Section list */}
        <aside className="rounded-xl border border-white/10 bg-white/5 p-4">
          <h3 className="text-sm font-semibold mb-3 text-vancore-muted uppercase tracking-wider">Секции</h3>
          {loading ? (
            <p className="text-sm text-vancore-muted">Зареждане...</p>
          ) : sections.length === 0 ? (
            <p className="text-sm text-vancore-muted">Няма намерени секции.</p>
          ) : (
            <div className="space-y-1">
              {sections.map((sec) => (
                <button
                  key={sec.id}
                  onClick={() => selectSection(sec.id)}
                  className={`w-full text-left rounded-lg px-3 py-2.5 text-sm transition-all ${
                    selectedId === sec.id
                      ? 'bg-gradient-to-r from-vancore-bronze to-vancore-gold text-black font-semibold'
                      : 'bg-white/5 hover:bg-white/10 text-vancore-light'
                  }`}
                >
                  {SECTION_LABELS[sec.id] || sec.id}
                </button>
              ))}
            </div>
          )}
        </aside>

        {/* Editor panel */}
        <section className="rounded-xl border border-white/10 bg-white/5 p-6">
          {selectedId ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{selectedLabel}</h3>
                <span className="text-xs text-vancore-muted bg-white/5 px-2 py-1 rounded">{selectedId}</span>
              </div>

              <textarea
                className="w-full h-72 rounded-lg bg-black/40 border border-white/10 p-4 text-sm text-white placeholder-vancore-muted focus:outline-none focus:border-vancore-bronze/50 resize-y"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Въведи текст за тази секция..."
              />

              <div className="flex items-center gap-3">
                <button
                  onClick={save}
                  disabled={saving}
                  className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-vancore-bronze to-vancore-gold text-black font-semibold text-sm disabled:opacity-60 hover:opacity-90 transition-opacity"
                >
                  {saving ? '⏳ Запазване...' : '💾 Запази'}
                </button>
                <span className="text-xs text-vancore-muted">Данните се запазват в Desktop/VANCORE/Admin-данни/</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-72 text-vancore-muted">
              <p>👈 Избери секция отляво за да редактираш</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
