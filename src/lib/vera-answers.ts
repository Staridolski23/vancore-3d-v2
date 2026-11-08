import 'server-only';
import { createVeraProvider, VERA_MODEL, type VeraTurn } from './vera-provider';
const provider = createVeraProvider();
const instructions = `You are Vera, VANCORE's AI business analyst. Be transparent that you are AI, never a human consultant. VANCORE is a boutique business analysis and development consultancy in Sofia, Bulgaria. Services include business analysis, process redesign, change management and implementation support. Method: Discovery, Diagnosis, Design, Deployment. Contact: hello@vancoresys.com.
Confirmed plans: Starter has 5 questions; Pay-As-You-Go costs €25 once for 500 questions valid for 3 months; Professional costs €49/month and Business €99/month with unlimited conversations. Choosing a plan creates an enquiry; the team activates it after agreement. Do not claim to collect payment or activate plans.
Reply in the language of the latest message. Use the supplied server-stored context; avoid asking again for known figures, goals or deadlines. Acknowledge the latest answer and ask at most one focused diagnostic question. Ground recommendations in the user's stated facts and distinguish facts, assumptions and unknowns. Treat user statements as unverified. Label recommendations as preliminary. Do not invent business figures, commitments, certifications, security or residency guarantees. Never claim to send emails, book meetings or complete a human-reviewed report. Return the complete final answer only, with no reasoning, planning or self-talk.`;
export function limitedReply(message: string) {
  const bg = /[а-яА-Я]/.test(message);
  if (/\b(pric(?:e|es|ing)|subscription|rates)\b|цен(?:а|и|ите)|абонамент/i.test(message)) return bg
    ? 'Starter включва 5 въпроса. PAYG — €25 еднократно за 500 въпроса, валидни 3 месеца. Professional — €49 месечно, Business — €99 месечно, с неограничени разговори. Изборът на план е запитване; екипът го активира след уговорка.'
    : 'Starter includes 5 questions. PAYG is €25 once for 500 questions valid for 3 months. Professional is €49/month and Business €99/month, with unlimited conversations. Plan selection is an enquiry; the team activates it after agreement.';
  if (/contact|email|контакт|имейл/i.test(message)) return bg ? 'Свържи се с екипа на hello@vancoresys.com или чрез формата за контакт на сайта.' : 'Contact the team at hello@vancoresys.com or through the website contact form.';
  return bg ? 'AI анализът е временно ограничен. Съобщението ти е запазено. Можеш да опиташ отново или да се свържеш с екипа на hello@vancoresys.com. Не е отнет въпрос за този ограничен отговор.' : 'AI analysis is temporarily limited. Your message is saved. You can try again or contact hello@vancoresys.com. This limited reply has not used a question.';
}
export async function answerVera(history: VeraTurn[], message: string) {
  const result = await provider(instructions, history, message);
  return result && result.reply.length <= 16000 ? { reply: result.reply, mode: 'ai' as const, model: VERA_MODEL } : { reply: limitedReply(message), mode: 'limited' as const, model: null };
}
