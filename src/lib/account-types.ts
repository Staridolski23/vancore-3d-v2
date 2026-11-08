export interface AdminClient {
  id: string; name: string; email: string; company: string; phone: string;
  plan: string; role?: string; subscription_status: string; created_at: string;
  email_verified: number; credits: number; updated_at: string | null;
  subscription_end?: string | null;
}
export interface AccountAudit {
  id: string; actor_id: string; actor_name: string | null; created_at: string; note: string | null;
  before_values: Record<string, string | number | null>; after_values: Record<string, string | number | null>;
}
