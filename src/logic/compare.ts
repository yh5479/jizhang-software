import type { Purchase } from '../types';

// 单条购买经过比价计算后的结果
export interface ComparedPurchase extends Purchase {
  deltaPct: number | null; // 相对「上一次购买」的差价%，正=贵，负=便宜
  cheaper: boolean | null; // 相对上一次是否更便宜
}

export type Verdict = 'great' | 'normal' | 'expensive';

export interface ItemComparison {
  purchases: ComparedPurchase[]; // 购买日期倒序（最新在前）
  minUnitPrice: number; // 历史最低可比单价
  avgUnitPrice: number; // 历史平均可比单价
  latestUnitPrice: number; // 最近一次可比单价
  verdict: Verdict;
  verdictText: string;
}

function timeOf(iso: string): number {
  const t = Date.parse(iso);
  return Number.isNaN(t) ? 0 : t;
}

/**
 * 计算某消耗品的比价结论。
 * - 按购买日期倒序排；每条相对「上一次（更早）购买」算差价%。
 * - 历史最低 / 平均 / 最近单价。
 * - 划算结论：最近 ≤ 最低 -> 很划算；≤ 平均 -> 正常；> 平均 -> 偏贵。
 */
export function buildComparison(purchases: Purchase[]): ItemComparison {
  const sorted = [...purchases].sort((a, b) => timeOf(b.purchased_at) - timeOf(a.purchased_at));

  const compared: ComparedPurchase[] = [];
  let prev: Purchase | null = null;
  for (const p of sorted) {
    let deltaPct: number | null = null;
    let cheaper: boolean | null = null;
    if (prev && prev.unit_price > 0) {
      deltaPct = ((p.unit_price - prev.unit_price) / prev.unit_price) * 100;
      cheaper = p.unit_price < prev.unit_price;
    }
    compared.push({ ...p, deltaPct, cheaper });
    prev = p;
  }

  const prices = sorted.map((p) => p.unit_price);
  const minUnitPrice = prices.length ? Math.min(...prices) : 0;
  const avgUnitPrice = prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
  const latestUnitPrice = sorted.length ? sorted[0].unit_price : 0;

  let verdict: Verdict = 'normal';
  let verdictText = '暂无数据';
  if (prices.length > 0) {
    if (latestUnitPrice <= minUnitPrice + 1e-9) {
      verdict = 'great';
      verdictText = '现在买很划算';
    } else if (latestUnitPrice <= avgUnitPrice + 1e-9) {
      verdict = 'normal';
      verdictText = '价格正常，可入手';
    } else {
      verdict = 'expensive';
      verdictText = '偏贵，建议再等等';
    }
  }

  return { purchases: compared, minUnitPrice, avgUnitPrice, latestUnitPrice, verdict, verdictText };
}

// 用于单品详情的横向条形对比：以历史最低为基准 100%，换算每条的比例与便宜/贵%。
export interface BarRow {
  label: string; // 购买日期
  unitPrice: number;
  widthPct: number; // 相对最大值的可视宽度 0-100
  deltaText: string; // 相对最低的差价描述
  tone: 'up' | 'down' | 'flat';
}

export function buildBars(comparison: ItemComparison): BarRow[] {
  const { purchases, minUnitPrice } = comparison;
  if (purchases.length === 0 || minUnitPrice <= 0) return [];
  const max = Math.max(...purchases.map((p) => p.unit_price));
  return purchases.map((p) => {
    const widthPct = max > 0 ? (p.unit_price / max) * 100 : 0;
    const ratio = p.unit_price / minUnitPrice;
    let deltaText: string;
    let tone: BarRow['tone'];
    if (ratio <= 1 + 1e-9) {
      deltaText = '最低';
      tone = 'flat';
    } else {
      const pct = (ratio - 1) * 100;
      deltaText = `贵 ${pct.toFixed(0)}%`;
      tone = 'up';
    }
    return {
      label: p.purchased_at.slice(0, 10),
      unitPrice: p.unit_price,
      widthPct,
      deltaText,
      tone,
    };
  });
}
