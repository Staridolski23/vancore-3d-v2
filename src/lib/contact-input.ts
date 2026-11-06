export type ContactInput = { sender_name: string; sender_email: string; subject: string; message: string };
import { contactInput as normalize } from '../../ops/backend/contact-input.cjs';
export function contactInput(value: unknown): ContactInput | null {
  return normalize(value);
}
