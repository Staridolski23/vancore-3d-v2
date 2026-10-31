export type ContactInput = { sender_name: string; sender_email: string; subject: string; message: string };
export function contactInput(value: unknown): ContactInput | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const body = value as Record<string, unknown>;
  const field = (name: string, fallback?: string) => typeof body[name] === 'string' ? (body[name] as string).trim() : fallback && typeof body[fallback] === 'string' ? (body[fallback] as string).trim() : '';
  const sender_name = field('sender_name', 'name'), sender_email = field('sender_email', 'email');
  const subject = field('subject') || 'Website enquiry', message = field('message'), company = field('company'), plan = field('plan');
  if (!sender_name || sender_name.length > 150 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sender_email) || sender_email.length > 254 || subject.length > 200 || !message || message.length > 10000 || company.length > 200 || plan.length > 50 || /[\r\n]/.test(sender_name + sender_email + subject + company + plan)) return null;
  return { sender_name, sender_email, subject, message: [company && 'Company: ' + company, plan && 'Selected plan: ' + plan, message].filter(Boolean).join('\n\n') };
}
