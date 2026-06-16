'use client';

import { useEffect, useState } from 'react';

type SectionData = {
  title?: string;
  subtitle?: string;
  body?: string;
  type?: string;
  styles?: Record<string, string>;
  slides?: { id: string; title?: string; subtitle?: string; image?: string }[];
  media?: { id: string; url: string; type: 'image' | 'video'; caption?: string }[];
};

type SiteContent = {
  sections: Record<string, SectionData>;
  order: string[];
  footer?: { text?: string; contactEmail?: string };
};

export function useSiteContent() {
  const [content, setContent] = useState<SiteContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => { load(); }, []);

  const getSection = (id: string): SectionData | null => {
    if (!content) return null;
    return content.sections[id] || null;
  };

  const getOrder = (): string[] => content?.order || [];
  const getFooter = () => content?.footer || {};

  return { content, loading, error, getSection, getOrder, getFooter, reload: load };
}
