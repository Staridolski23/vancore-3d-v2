import { promises as fs } from 'fs';
import path from 'path';

const PROFILE_PATH = path.join(process.cwd(), 'Admin-данни', 'editor-profiles.json');
const SITE_PATH = path.join(process.cwd(), 'Admin-данни', 'editor-site.json');

export async function getAccounts() {
  try {
    if (!(await exists(PROFILE_PATH))) return [];
    const raw = await fs.readFile(PROFILE_PATH, 'utf8');
    const data = JSON.parse(raw);
    return data.accounts || [];
  } catch {
    return [];
  }
}

export async function getSections(): Promise<{ id: string; text: string }[]> {
  try {
    if (!(await exists(SITE_PATH))) return getDefaultSections();
    const raw = await fs.readFile(SITE_PATH, 'utf8');
    const data = JSON.parse(raw);
    const sections = data?.site?.sections || {};
    if (typeof sections !== 'object' || sections === null) return getDefaultSections();
    return Object.entries(sections).map(([id, value]) => ({
      id,
      text: extractText(value),
    }));
  } catch {
    return getDefaultSections();
  }
}

export async function updateSectionText(sectionId: string, text: string) {
  const raw = await exists(SITE_PATH) ? await fs.readFile(SITE_PATH, 'utf8') : '{}';
  const data = JSON.parse(raw);
  if (!data.site) data.site = { sections: {} };
  if (!data.site.sections) data.site.sections = {};
  data.site.sections[sectionId] = { ...(data.site.sections[sectionId] || {}), text };
  await fs.writeFile(SITE_PATH, JSON.stringify(data, null, 2));
  return data;
}

export function buildPreviewHtml(sections: { id: string; text: string }[]) {
  const items = sections
    .slice()
    .map((section, idx) => `<section data-index="${idx}" data-section="${section.id}" class="min-h-[180px]">
      <h2 class="text-xl font-semibold mb-2">${section.id.toUpperCase()}</h2>
      <p class="text-vancore-muted">${section.text}</p>
    </section>`)
    .join('\n');
  return `<!DOCTYPE html>
<html lang="bg">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>VANCORE Admin Preview</title></head>
<body class="min-h-screen bg-[#0b0c10] text-white">
  <header class="border-b border-white/10 px-6 py-4"><h1 class="text-xl font-semibold">ADMIN PREVIEW</h1></header>
  <main class="max-w-5xl mx-auto py-10 px-6 space-y-6">
    ${items || '<p class="text-vancore-muted">Няма заредени секции.</p>'}
  </main>
</body>`;
}

function extractText(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value !== null) {
    if ('text' in value && typeof (value as { text: unknown }).text === 'string') return (value as { text: string }).text;
    return JSON.stringify(value);
  }
  return String(value);
}

function getDefaultSections(): { id: string; text: string }[] {
  return [
    { id: 'hero', text: 'Намерете счупените звена във вашия бизнес' },
    { id: 'services', text: 'Какво анализираме' },
    { id: 'methodology', text: 'Нашата Методология' },
    { id: 'industries', text: 'Целеви отрасли' },
    { id: 'team', text: 'Отборът зад VANCORE' },
    { id: 'contact', text: 'Започнете промяната' },
    { id: 'chat', text: 'БЕЗПЛАТЕН AI АНАЛИЗ' },
  ];
}

async function exists(path: string) {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}
