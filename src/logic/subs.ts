import type { SubCycle, Subscription } from '../types';

// 计费周期中文标签
export const CYCLE_LABEL: Record<SubCycle, string> = {
  monthly: '月付',
  quarterly: '季付',
  semiannual: '半年付',
  yearly: '年付',
};

// 折算每月成本：季付 ÷3、半年付 ÷6、年付 ÷12
export function monthlyCost(s: Subscription): number {
  if (s.cycle === 'monthly') return s.price;
  if (s.cycle === 'quarterly') return s.price / 3;
  if (s.cycle === 'semiannual') return s.price / 6;
  return s.price / 12;
}

// 距今天数（向上取整；负数表示已过期）
export function daysUntil(isoDate: string): number {
  const target = new Date(isoDate).getTime();
  if (Number.isNaN(target)) return 0;
  return Math.ceil((target - Date.now()) / 86_400_000);
}
