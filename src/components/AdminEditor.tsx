'use client';

import { useState, useEffect, useCallback } from 'react';

const SECTIONS_BY_ID: Record<string, string> = {
  hero: 'Hero',
  services: 'Services',
  methodology: 'Methodology',
  industries: 'Industries',
  team: 'Team',
  contact: 'Contact',
};

export default function AdminEditor() {
  const [sections, setSections] = useState<{ id: string; label: string; text: string }[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/sections');
      const data = (await res.json().catch(() => ({ sections: [] }))) as { sections?: { id: string; text?: string }[] };
      const items = (data.sections || [])
        .filter((item): item is { id: string; text?: string } => Boolean(item.id))
        .map((item) => ({
          id: item.id,
          label: SECTIONS_BY_ID[item.id] || item.id,
          text: item.text || '',
        }));
      setSections(items);
      if (!selectedId && items.length) {
        setSelectedId(items[0].id);
        setText(items[0].text);
      }
    } catch (error) {
      console.error(error);
      setStatus('Неуспешно зареждане на секции');
    } finally {
      setLoading(false);
    }
  }, [selectedId]);

  useEffect(() => {
    load();
  }, [load]);

  const loadPreview = useCallback(async () => {
    setStatus('Зареждане на preview...');
    try {
      const res = await fetch('/api/admin/preview');
      const data = (await res.json().catch(() => ({ html: '' }))) as { html?: string };
      setPreviewHtml(data.html || '');
      setStatus(null);
    } catch (error) {
      console.error(error);
      setStatus('Неуспешно зареждане на preview');
    }
  }, []);

  useEffect(() => {
    loadPreview();
  }, [loadPreview]);

  const select = (id: string) => {
    const section = sections.find((item) => item.id === id);
    if (!section) return;
    setSelectedId(id);
    setText(section.text);
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
      await loadPreview();
      setStatus('Запазено ✅');
    } catch (error) {
      console.error(error);
      setStatus('Грешка при запазване');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_400px] gap-6">
        <aside className="rounded-xl border border-white/10 bg-white/5 p-4">
          <h2 className="text-sm font-semibold mb-3">Секции</h2>
          <div className="space-y-1">
            {loading ? (
              <p className="text-vancore-muted text-sm">Зареждане...</p>
            ) : sections.length ? (
              sections.map((item) => (
                <button
                  key={item.id}
                  onClick={() => select(item.id)}
                  className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                    selectedId === item.id
                      ? 'bg-[var(--vancore-bronze,#c9a84c)] text-black'
                      : 'bg-white/5 hover:bg-white/10'
                  }`}
                >
                  {item.label}
                </button>
              ))
            ) : (
              <p className="text-vancore-muted text-sm">Няма секции.</p>
            )}
          </div>
        </aside>

        <section className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Редакция на секция</h2>
            <button
              onClick={loadPreview}
              className="px-3 py-1.5 rounded bg-white/10 hover:bg-white/20 text-xs"
            >
              🔄 Преглед
            </button>
          </div>
          {selectedId ? (
            <div className="mt-4 space-y-3">
              <p className="text-xs text-vancore-muted">
                Секция:{' '}
                <span className="text-white">
                  {SECTIONS_BY_ID[selectedId] || selectedId}
                </span>
              </p>
              <textarea
                className="w-full h-64 rounded bg-black/40 border border-white/10 p-3 text-sm"
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
              <button
                onClick={save}
                disabled={saving}
                className="w-full rounded bg-[var(--vancore-bronze,#c9a84c)] text-black py-2 text-sm font-semibold disabled:opacity-70"
              >
                {saving ? 'Запазване...' : '💾 Запази текст'}
              </button>
              <p className="text-xs text-vancore-muted">
                Промяната ще се отрази в админ preview-то след запазване. За да се отрази в сайта, използвай публикуването на секцията.
              </p>
            </div>
          ) : (
            <p className="mt-4 text-sm text-vancore-muted">Избери секция отляво.</p>
          )}
        </section>

        <aside className="rounded-xl border border-white/10 bg-black/40 p-4">
          <h2 className="text-sm font-semibold mb-3">Admin Preview</h2>
          {previewHtml ? (
            <iframe title="admin-preview" src="/api/admin/preview" className="w-full h-[520px] rounded-lg bg-black" />
          ) : (
            <p className="text-vancore-muted text-sm">Няма наличен preview.</p>
          )}
        </aside>
      </div>
      {status ? (
        <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm">{status}</div>
      ) : null}
    </div>
  );
}
