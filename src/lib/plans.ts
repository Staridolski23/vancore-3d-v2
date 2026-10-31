export const PLAN_DETAILS = {
  payg: { name: 'Pay-As-You-Go', price: '€25 one-time' },
  professional: { name: 'Professional', price: '€49/month' },
  business: { name: 'Business', price: '€99/month' },
} as const;
export type PlanId = keyof typeof PLAN_DETAILS;
export function planId(value: unknown): PlanId | null {
  return typeof value === 'string' && Object.hasOwn(PLAN_DETAILS, value) ? value as PlanId : null;
}
export function planEnquiryUrl(value: PlanId) { return '/contact?plan=' + encodeURIComponent(value); }
