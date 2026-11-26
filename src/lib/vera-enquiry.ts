export const ENQUIRY_TOPICS = ['operations', 'business', 'systems', 'other'] as const;
export const ENQUIRY_URGENCIES = ['soon', 'month', 'exploring'] as const;
export type VeraEnquiry = { topic: typeof ENQUIRY_TOPICS[number]; company: string; problem: string; goal: string; urgency: typeof ENQUIRY_URGENCIES[number]; name: string; email: string; phone: string; contact: 'email' | 'phone'; language: 'bg' | 'en'; shareWithTeam: boolean; website: string };
export const EMPTY_ENQUIRY: VeraEnquiry = { topic: 'operations', company: '', problem: '', goal: '', urgency: 'exploring', name: '', email: '', phone: '', contact: 'email', language: 'bg', shareWithTeam: false, website: '' };
export const TOPIC_LABELS = { operations: ['Процеси и организация', 'Processes and operations'], business: ['Бизнес консултация', 'Business consultation'], systems: ['Дигитални системи', 'Digital systems'], other: ['Друго / не съм сигурен', 'Other / not sure'] };
export const URGENCY_LABELS = { soon: ['Възможно най-скоро', 'As soon as possible'], month: ['В следващия месец', 'Within a month'], exploring: ['Проучвам възможностите', 'Exploring options'] };
const short = (s: unknown, max: number) => typeof s === 'string' && s.trim().length <= max && !/[\r\n\x00-\x1f\x7f]/.test(s);
export function enquiryInput(value: unknown): VeraEnquiry | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const v = value as Record<string, unknown>;
  if (Object.keys(v).some(k => !Object.hasOwn(EMPTY_ENQUIRY, k)) || v.shareWithTeam !== true || v.website !== '' || !['bg', 'en'].includes(String(v.language)) || !ENQUIRY_TOPICS.includes(v.topic as VeraEnquiry['topic']) || !ENQUIRY_URGENCIES.includes(v.urgency as VeraEnquiry['urgency']) || !['email', 'phone'].includes(String(v.contact))) return null;
  if (!short(v.name, 150) || !(v.name as string).trim() || !short(v.company, 200) || !short(v.email, 254) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((v.email as string).trim()) || !short(v.phone, 40) || ((v.phone as string).trim() && !/^[+()\d .-]{5,40}$/.test((v.phone as string).trim())) || (v.contact === 'phone' && !(v.phone as string).trim())) return null;
  for (const k of ['problem', 'goal']) if (typeof v[k] !== 'string' || !(v[k] as string).trim() || (v[k] as string).length > 2000 || /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(v[k] as string)) return null;
  return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, typeof x === 'string' ? x.trim() : x])) as VeraEnquiry;
}
export function enquirySummary(v: VeraEnquiry) {
  const i = v.language === 'bg' ? 0 : 1;
  return [i === 0 ? 'Запитване чрез Vera — виртуален асистент' : 'Enquiry through Vera — virtual assistant',
    `${i === 0 ? 'Тема' : 'Topic'}: ${TOPIC_LABELS[v.topic][i]}`, `${i === 0 ? 'Компания' : 'Company'}: ${v.company || '—'}`,
    `${i === 0 ? 'Ситуация' : 'Situation'}:\n${v.problem}`, `${i === 0 ? 'Желан резултат' : 'Desired outcome'}:\n${v.goal}`,
    `${i === 0 ? 'Кога' : 'Timing'}: ${URGENCY_LABELS[v.urgency][i]}`, `${i === 0 ? 'Име' : 'Name'}: ${v.name}`, `Email: ${v.email}`,
    ...(v.phone ? [`${i === 0 ? 'Телефон' : 'Phone'}: ${v.phone}`] : []), `${i === 0 ? 'Предпочитан контакт' : 'Preferred contact'}: ${v.contact === 'phone' ? (i === 0 ? 'Телефон' : 'Phone') : 'Email'}`].join('\n\n');
}
