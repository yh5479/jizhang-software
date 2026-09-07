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

/* ============ 账单品类 ============ */
export const BILL_CATEGORIES = ['餐饮', '交通', '购物', '娱乐', '居家', '医疗', '其他'] as const;
export const BILL_CAT_COLOR: Record<string, string> = {
  餐饮: 'var(--c-expense)',
  交通: 'var(--c-time)',
  购物: 'var(--c-note)',
  娱乐: 'var(--c-asset)',
  居家: 'var(--c-income)',
  医疗: 'var(--c-expense)',
  其他: 'var(--c-income)',
};

/* ============ 会员品类 ============ */
export const SUB_CATEGORIES = ['视频', '音乐', '工具', '网盘', '其他'] as const;

/* ============ 资产品类 ============ */
export const ASSET_MONEY_CATS = ['现金', '储蓄卡', '电子支付', '投资', '其他'] as const;
export const ASSET_PHYSICAL_CATS = ['数码', '家电', '装备', '家具', '其他'] as const;
