export type CalculationKind = 'gross_margin_percent' | 'markup_percent' | 'conversion_percent' | 'utilisation_percent' | 'relative_change_percent' | 'percentage_point_change';
type Input = { name: string; value: number; unit: string; sourceRequestId: string; quote: string };
export type BusinessCalculation = { kind: CalculationKind; inputs: Input[]; result: number; resultUnit: '%' | 'percentage points' };
type Evidence = { sources: { requestId: string; statement: string }[] };
const names: Record<CalculationKind, string[]> = { gross_margin_percent: ['revenue', 'costOfSales'], markup_percent: ['sellingPrice', 'cost'], conversion_percent: ['conversions', 'opportunities'], utilisation_percent: ['usedCapacity', 'availableCapacity'], relative_change_percent: ['before', 'after'], percentage_point_change: ['before', 'after'] };
// These verify arithmetic and quoted inputs, not economic meaning, provenance or causation.
export function validateBusinessCalculations(value: unknown, evidence: Evidence): BusinessCalculation[] | null {
  if (!Array.isArray(value) || value.length > 6) return null;
  const result: BusinessCalculation[] = [];
  for (const item of value) {
    if (!item || !Object.hasOwn(names, item.kind) || !Array.isArray(item.inputs) || item.inputs.length !== 2 || !Number.isFinite(item.result)) return null;
    const kind = item.kind as CalculationKind, required = names[kind];
    if (!required.every(name => item.inputs.filter((i: Input) => i?.name === name).length === 1)) return null;
    for (const input of item.inputs) {
      if (!Number.isFinite(input.value) || Math.abs(input.value) > 1e15 || typeof input.unit !== 'string' || !input.unit.trim() || input.unit.length > 60 || typeof input.quote !== 'string' || input.quote.length > 1500 || !evidence.sources.some(s => s.requestId === input.sourceRequestId && s.statement.includes(input.quote))) return null;
      const numbers = input.quote.match(/[-+]?\d+(?:[.,]\d+)?/g) || [];
      if (!numbers.some((number: string) => Number(number.replace(',', '.')) === input.value)) return null;
    }
    const a = item.inputs.find((i: Input) => i.name === required[0]) as Input, b = item.inputs.find((i: Input) => i.name === required[1]) as Input;
    if (a.unit !== b.unit || a.value < 0 || b.value < 0) return null;
    let expected: number;
    if (kind === 'percentage_point_change') { if (a.unit !== '%' || a.value > 100 || b.value > 100 || item.resultUnit !== 'percentage points') return null; expected = b.value - a.value; }
    else {
      if (item.resultUnit !== '%') return null;
      const denominator = ['gross_margin_percent', 'relative_change_percent'].includes(kind) ? a.value : b.value;
      if (denominator === 0) return null;
      if (['conversion_percent', 'utilisation_percent'].includes(kind) && a.value > b.value) return null;
      expected = kind === 'gross_margin_percent' ? (a.value - b.value) / a.value * 100 : kind === 'markup_percent' ? (a.value - b.value) / b.value * 100 : kind === 'relative_change_percent' ? (b.value - a.value) / a.value * 100 : a.value / b.value * 100;
    }
    if (Math.abs(expected - item.result) > 0.011) return null;
    result.push({ kind, inputs: item.inputs.map(({ name, value, unit, sourceRequestId, quote }: Input) => ({ name, value, unit, sourceRequestId, quote })), result: Math.round(expected * 10000) / 10000, resultUnit: item.resultUnit });
  }
  return result;
}
export function businessCalculationLabel(kind: CalculationKind) {
  return ({gross_margin_percent:'Брутен марж / Gross margin',markup_percent:'Надценка / Markup',conversion_percent:'Конверсия / Conversion',utilisation_percent:'Използван капацитет / Capacity utilisation',relative_change_percent:'Относителна промяна / Relative change',percentage_point_change:'Промяна в процентни пунктове / Percentage-point change'})[kind];
}
export function businessInputLabel(name: string) {
  return ({revenue:'Приходи / Revenue',costOfSales:'Себестойност на продажбите / Cost of sales',sellingPrice:'Продажна цена / Selling price',cost:'Себестойност / Cost',conversions:'Реализации / Conversions',opportunities:'Възможности / Opportunities',usedCapacity:'Използван капацитет / Used capacity',availableCapacity:'Наличен капацитет / Available capacity',before:'Начална стойност / Before',after:'Нова стойност / After'} as Record<string,string>)[name] || name;
}
export function businessCalculationText(item: BusinessCalculation, includeSourceIds = true) {
  const unit = item.resultUnit === '%' ? '%' : 'процентни пункта / percentage points';
  return `${businessCalculationLabel(item.kind)}: ${item.result} ${unit}\n${item.inputs.map(i => `${businessInputLabel(i.name)} = ${i.value} ${i.unit}\n${includeSourceIds ? 'Source '+i.sourceRequestId+': ' : ''}„${i.quote}“`).join('\n')}`;
}
