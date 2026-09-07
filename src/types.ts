// 共享领域类型（与数据库表一一对应）
export interface Expense {
  id: number;
  amount: number;
  category: string;
  note: string;
  created_at: string; // ISO 字符串
  consumption_item_id: number | null;
}

export interface ConsumptionItem {
  id: number;
  name: string;
  category: string;
  base_unit: string;
}

export interface Purchase {
  id: number;
  item_id: number;
  spec: string;
  total_units: number;
  unit_label: string; // 例如 "元/抽"
  price: number;
  unit_price: number; // price / total_units
  purchased_at: string; // ISO 字符串
}

export type SubCycle = 'monthly' | 'quarterly' | 'semiannual' | 'yearly';

export interface Subscription {
  id: number;
  name: string;
  category: string;
  price: number;
  cycle: SubCycle;
  next_renewal: string; // ISO date
  auto_renew: number; // 0/1
  status: 'active' | 'cancelled';
  note: string;
}

export type AssetType = 'money' | 'physical';

export interface Asset {
  id: number;
  type: AssetType;
  name: string;
  category: string;
  value: number;
  note: string;
  updated_at: string;
}
