'use client';

import { useEffect, useState } from 'react';

type SectionData = {
  title?: string;
  subtitle?: string;
  styles?: Record<string, string>;
};

type SiteContent = {
  sections: Record<string, SectionData>;
  order: string[];
};

export function useSiteContent() {
  const [content, setContent] = useState<SiteContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/content', { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to load content');
        const data = await res.json();
        setContent(data);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const getSection = (id: string) => {
    if (!content) return null;
    return content.sections[id] || null;
  };

  const getOrder = () => (content?.order || []);

  return { content, loading, error, getSection, getOrder };
}
