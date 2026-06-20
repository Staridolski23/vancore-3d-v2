'use client';
import { useEffect, useState } from 'react';

type Section = { title?: string; subtitle?: string; type?: string; styles?: Record<string, string> };

export default function PreviewPage({ params }: { params: { token: string } }) {
  const [sections, setSections] = useState<Record<string, Section>>({});
  const [order, setOrder] = useState<string[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/preview/${params.token}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to load');
        setSections(data.sections || {});
        setOrder(data.order || []);
      } catch (e: any) {
        setError(e.message);
      }
    };
    load();
  }, [params.token]);

  if (error) return <div className="min-h-screen flex items-center justify-center text-red-400">{error}</div>;

  return (
    <div className="min-h-screen bg-[#0b0c10] text-white">
      {(order || []).map((id) => {
        const sec = sections[id] || {};
        const btnColor = (sec.styles && sec.styles.buttonColor) || '#991930';
        const headingFont = (sec.styles && sec.styles.headingFont) || 'Bodoni Cyrillic, serif';
        return (
          <section key={id} className="py-16 px-6" style={{ fontFamily: "'Inter', sans-serif" }}>
            <div className="max-w-4xl mx-auto">
              <h1 className="text-4xl font-bold mb-4" style={{ fontFamily: headingFont }}>{sec.title || ''}</h1>
              <p className="text-lg text-gray-300 mb-6">{sec.subtitle || ''}</p>
              {sec.type === 'contact' && (
                <form className="max-w-md space-y-3" onSubmit={(e) => e.preventDefault()}>
                  <input className="w-full rounded bg-white/10 border border-white/10 px-4 py-2 text-white" placeholder="Име" />
                  <input className="w-full rounded bg-white/10 border border-white/10 px-4 py-2 text-white" placeholder="Имейл" />
                  <textarea className="w-full h-28 rounded bg-white/10 border border-white/10 px-4 py-2 text-white" placeholder="Съобщение" />
                  <button type="submit" className="px-6 py-2 rounded text-black font-semibold" style={{ background: btnColor }}>Изпрати</button>
                </form>
              )}
              {sec.type === 'chat' && (
                <div className="max-w-xl rounded-xl border border-white/10 bg-white/5 p-4">
                </div>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
