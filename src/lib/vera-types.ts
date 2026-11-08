export interface VeraQuota { plan: string; remaining: number | null; unlimited: boolean; allowed: boolean; validUntil: string | null; }
export interface VeraRequest { id: string; message: string; status: 'generating' | 'complete' | 'failed'; reply: string | null; mode: 'ai' | 'limited' | null; charged: boolean; created_at: string; }
export interface VeraReport { id: string; conversation_id: string; title: string; version: number; created_at: string; }
export interface VeraConversation { id: string; title: string; version: number; pending?: boolean; }
export interface VeraState {
  state: string; owner: 'account' | 'visitor'; quota?: VeraQuota; conversation: VeraConversation | null;
  conversations: VeraConversation[]; requests: VeraRequest[]; reports: VeraReport[]; hasOlderRequests?: boolean; reportId?: string; requestId?: string;
}
