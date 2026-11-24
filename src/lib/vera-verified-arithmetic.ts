import 'server-only';
import { businessCalculationText, validateBusinessCalculations } from './vera-business-calculations';

// A deliberately narrow calculator, not a language model or business diagnosis.
// Only explicit current-message monthly inputs qualify; ambiguity stays with intake.
export function verifiedGrossMargin(message: string) {
  if (!/брут(?:ен|ният|ния)\s+марж|gross\s+margin/iu.test(message)) return null;
  if (/надцен|markup|около|приблиз|approximately|about\s+\d|хиляд|\bthousand\b|различ|предход|минал|previous|last\s+month|следващ|next\s+month/iu.test(message)) return null;
  if (!/същия\s+месец|един\s+и\s+същ\s+месец|same\s+month/iu.test(message)) return null;
  if (/годин|годиш|седмиц|седмич|дневн|\b(?:year|annual|week|daily|day)\b/iu.test(message)) return null;
  const numbers = message.match(/[-+]?\d+(?:[.,]\d+)?/g) || [];
  if (numbers.length !== 2) return null;
  const amount = '(\\d+(?:[.,]\\d{1,2})?)\\s*(EUR|BGN|USD|GBP|евро|лева|лв\\.?|€)(?![\\p{L}\\p{N}_])';
  const read = (label: string) => [...message.matchAll(new RegExp('(?<![\\p{L}\\p{N}_])(?:'+label+')\\s*(?:(?:са|е|от|is|are)\\s*)?[:=]?\\s*'+amount,'giu'))];
  const revenue = read('приход(?:и(?:те)?|ът|а)?|revenues?');
  const costs = read('себестойност(?:та)?(?:\\s+на\\s+продажбите)?|cost\\s+of\\s+(?:sales|goods\\s+sold)|COGS');
  if (revenue.length !== 1 || costs.length !== 1) return null;
  const currency = (unit: string) => /^(?:€|евро)$/iu.test(unit) ? 'EUR' : /^(?:лева|лв\.?)$/iu.test(unit) ? 'BGN' : unit.toUpperCase();
  const unit = currency(revenue[0][2]);
  if (currency(costs[0][2]) !== unit) return null;
  const a = Number(revenue[0][1].replace(',','.')), b = Number(costs[0][1].replace(',','.'));
  if (!(a > 0) || b < 0 || a > 1e15 || b > 1e15) return null;
  const evidence = {sources:[{requestId:'current_message',statement:message}]};
  const calculations = validateBusinessCalculations([{kind:'gross_margin_percent',inputs:[
    {name:'revenue',value:a,unit:unit+'/month',sourceRequestId:'current_message',quote:message},
    {name:'costOfSales',value:b,unit:unit+'/month',sourceRequestId:'current_message',quote:message}
  ],result:(a-b)/a*100,resultUnit:'%'}],evidence);
  if (!calculations?.length) return null;
  const bg = /[а-я]/iu.test(message);
  const reply = [
    bg ? 'Проверено изчисление по формула — без заявка към AI модел.' : 'Formula-checked calculation — no AI model request.',
    businessCalculationText(calculations[0],false),
    bg ? 'Формула: (приходи − себестойност на продажбите) / приходи × 100. Това е брутен марж; той не е нетна печалба или надценка. Изчислението използва посочените непроверени данни за същия месец. Класификацията на разходите изисква отделна проверка. Не е използван AI въпрос.' : 'Formula: (revenue − cost of sales) / revenue × 100. This is gross margin, not net profit or markup. It uses the stated unverified same-month inputs; cost classification requires separate verification. No AI question was used.'
  ].join('\n\n');
  // Existing limited completion means no provider success is claimed and no credit is charged.
  return {reply,mode:'limited' as const,model:null,engine:'verified_arithmetic' as const,calculations};
}
