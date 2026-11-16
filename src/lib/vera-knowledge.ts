import 'server-only';
import { createHash } from 'node:crypto';
type Rpc = (action: string, input: object, actor?: string) => Promise<any>;
type Document = { source: { id: string; url: string }; content: string; sha256: string; provisions: { article: string; text: string }[] };
export function createKnowledgeStore(rpc: Rpc) {
  return {
    async businessMethod() {
      const data = await rpc('method', { sourceId: 'vancore-business-method' });
      if (!data || typeof data.content !== 'string' || !/^[a-f0-9-]{36}$/.test(data.versionId) || data.content.length < 100 || data.content.length > 6000) throw Error('Business knowledge unavailable');
      return { content: data.content, versionId: data.versionId };
    },
    async archiveAndSelect(document: Document, query: string) {
      if (createHash('sha256').update(document.content).digest('hex') !== document.sha256) throw Error('Source content digest mismatch');
      const saved = await rpc('ingest', { sourceId: document.source.id, url: document.source.url, content: document.content, sha256: document.sha256, chunks: document.provisions.map(p => ({ label: p.article, body: p.text })) });
      if (!saved || !/^[a-f0-9-]{36}$/.test(saved.versionId)) throw Error('Source archive unavailable');
      const articles = [...query.matchAll(/(?:чл\.|Article)\s*(\d+[а-яa-z]?)/gi)].slice(0, 12).flatMap(m => ['Чл. ' + m[1] + '.', 'Article ' + m[1]]);
      const selected = await rpc('select', { sourceId: document.source.id, versionId: saved.versionId, query: query.slice(-6000), articles });
      if (!Array.isArray(selected?.chunks) || selected.chunks.length > 4 || !selected.chunks.every((p: any) => document.provisions.some(s => s.article === p.article && s.text === p.text))) throw Error('Archived selection mismatch');
      return { versionId: saved.versionId as string, provisions: selected.chunks as Document['provisions'] };
    },
    async sourceUnavailable(sourceId: string) { await rpc('unavailable', { sourceId }); },
    async scenario(id: string, actor: string) { return rpc('scenario', { scenarioId: id }, actor); },
    async evaluations(actor: string) { return rpc('evaluations', {}, actor); },
    async saveEvaluation(id: string, actor: string, lease: string, result: { reply: string; mode: string; model?: string | null; knowledgeRefs?: string[] }, checks: object) {
      return rpc('evaluation', { scenarioId: id, lease, output: result.reply, mode: result.mode, model: result.model || null, knowledgeRefs: result.knowledgeRefs || [], checks }, actor);
    },
  };
}
