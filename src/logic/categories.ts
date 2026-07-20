// 记账 / 消耗品共用的品类，以及品类语义色（引用 CSS 变量，自动适配主题）
export const CATEGORIES = ['居家', '数码', '餐饮', '洗护', '其它'] as const;
export type Category = (typeof CATEGORIES)[number];

// 品类 -> CSS 颜色变量名（亮/暗主题下自动切换）
export const CAT_COLOR: Record<string, string> = {
  居家: 'var(--c-asset)',
  数码: 'var(--c-note)',
  餐饮: 'var(--c-expense)',
  洗护: 'var(--c-time)',
  其它: 'var(--c-income)',
};

// 本月预算常量（v1 写死，后续可做成设置项）
export const MONTHLY_BUDGET = 3000;
