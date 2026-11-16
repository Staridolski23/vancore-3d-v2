import 'server-only';
import { createKnowledgeStore } from './vera-knowledge';
import { supabaseAdmin } from './supabase';
export const veraKnowledge = createKnowledgeStore(async (action, input, actor) => {
  const { data, error } = await supabaseAdmin.rpc('vancore_vera_knowledge', { p_action: action, p_input: input, p_actor: actor || null });
  if (error || !data) throw Object.assign(Error('Knowledge storage unavailable'), { code: error?.code });
  return data;
});
