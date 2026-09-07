import { getDb, persist } from './db';
import type {
  Asset,
  AssetType,
  ConsumptionItem,
  Expense,
  Purchase,
  SubCycle,
  Subscription,
} from '../types';
import { parseSpec } from '../logic/unit';
import { buildComparison, type ItemComparison, type Verdict } from '../logic/compare';

function rows<T>(res: { values?: any[] } | null | undefined): T[] {
  return ((res && res.values) || []) as T[];
}

function daysAgo(n: number): string {
  return new Date(Date.now() - n * 86_400_000).toISOString();
}

function daysAhead(n: number): string {
  return new Date(Date.now() + n * 86_400_000).toISOString();
}

async function tableEmpty(name: string): Promise<boolean> {
  const db = await getDb();
  const res = await db.query(`SELECT COUNT(*) as c FROM ${name}`);
  return (rows<{ c: number }>(res)[0]?.c ?? 0) === 0;
}

/* ============ 记账 expense ============ */

export interface AddExpenseInput {
  amount: number;
  category: string;
  note: string;
  consumption_item_id: number | null;
  created_at?: string;
}

export async function addExpense(input: AddExpenseInput): Promise<void> {
  const db = await getDb();
  const created_at = input.created_at ?? new Date().toISOString();
  await db.run(
    `INSERT INTO expenses (amount, category, note, created_at, consumption_item_id)
     VALUES (?, ?, ?, ?, ?)`,
    [input.amount, input.category, input.note, created_at, input.consumption_item_id]
  );
  await persist();
}

export async function listExpensesRecent(limit = 20): Promise<Expense[]> {
  const db = await getDb();
  const res = await db.query(
    'SELECT * FROM expenses ORDER BY created_at DESC LIMIT ?',
    [limit]
  );
  return rows<Expense>(res);
}

export async function listExpensesThisMonth(): Promise<Expense[]> {
  const db = await getDb();
  const first = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
  const res = await db.query(
    'SELECT * FROM expenses WHERE created_at >= ? ORDER BY created_at DESC',
    [first]
  );
  return rows<Expense>(res);
}

/* 账单：复用 expenses 表，consumption_item_id 恒为 null（账单与消耗品彻底分开） */

export interface AddBillInput {
  amount: number;
  category: string;
  note: string;
  created_at?: string;
}

export async function addBill(input: AddBillInput): Promise<void> {
  await addExpense({
    amount: input.amount,
    category: input.category,
    note: input.note,
    consumption_item_id: null,
    created_at: input.created_at,
  });
}

export async function listPurchasesThisMonth(): Promise<Purchase[]> {
  const db = await getDb();
  const first = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
  const res = await db.query(
    'SELECT * FROM purchases WHERE purchased_at >= ? ORDER BY purchased_at DESC',
    [first]
  );
  return rows<Purchase>(res);
}

/* ============ 消耗品 consumption item ============ */

export async function addConsumptionItem(input: {
  name: string;
  category: string;
  base_unit: string;
}): Promise<number> {
  const db = await getDb();
  await db.run('INSERT INTO consumption_items (name, category, base_unit) VALUES (?, ?, ?)', [
    input.name,
    input.category,
    input.base_unit,
  ]);
  await persist();
  const r = await db.query('SELECT last_insert_rowid() as id');
  return (rows<{ id: number }>(r)[0]?.id ?? 0) as number;
}

export async function listItemsByCategory(category?: string): Promise<ConsumptionItem[]> {
  const db = await getDb();
  let sql = 'SELECT * FROM consumption_items';
  const args: (string | number)[] = [];
  if (category && category !== '全部') {
    sql += ' WHERE category = ?';
    args.push(category);
  }
  sql += ' ORDER BY id DESC';
  const res = await db.query(sql, args);
  return rows<ConsumptionItem>(res);
}

/* ============ 购买 purchase ============ */

export interface AddPurchaseInput {
  item_id: number;
  spec: string;
  price: number;
  purchased_at?: string;
}

export async function addPurchase(input: AddPurchaseInput): Promise<void> {
  const db = await getDb();
  const parsed = parseSpec(input.spec);
  const totalUnits = parsed.totalUnits > 0 ? parsed.totalUnits : 1;
  const unitPrice = input.price / totalUnits;
  const purchased_at = input.purchased_at ?? new Date().toISOString();
  await db.run(
    `INSERT INTO purchases (item_id, spec, total_units, unit_label, price, unit_price, purchased_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      input.item_id,
      input.spec,
      totalUnits,
      parsed.unitLabel,
      input.price,
      unitPrice,
      purchased_at,
    ]
  );
  await persist();
}

export async function listPurchasesByItem(itemId: number): Promise<Purchase[]> {
  const db = await getDb();
  const res = await db.query('SELECT * FROM purchases WHERE item_id = ?', [itemId]);
  return rows<Purchase>(res);
}

/* ============ 比价 ============ */

export interface ItemSummary {
  item: ConsumptionItem;
  latestUnitPrice: number;
  verdict: Verdict;
  verdictText: string;
  purchaseCount: number;
  lastSpec: string;
  latestPrice: number;
}

export async function listItemSummaries(category?: string): Promise<ItemSummary[]> {
  const items = await listItemsByCategory(category);
  return Promise.all(
    items.map(async (item) => {
      const purchases = await listPurchasesByItem(item.id);
      const cmp = buildComparison(purchases);
      return {
        item,
        latestUnitPrice: cmp.latestUnitPrice,
        verdict: cmp.verdict,
        verdictText: cmp.verdictText,
        purchaseCount: purchases.length,
        lastSpec: purchases[0]?.spec ?? '',
        latestPrice: purchases[0]?.price ?? 0,
      };
    })
  );
}

export async function getItemComparison(itemId: number): Promise<{
  item: ConsumptionItem | undefined;
  comparison: ItemComparison;
}> {
  const db = await getDb();
  const itemRes = await db.query('SELECT * FROM consumption_items WHERE id = ?', [itemId]);
  const item = rows<ConsumptionItem>(itemRes)[0];
  const purchases = await listPurchasesByItem(itemId);
  return { item, comparison: buildComparison(purchases) };
}

/* ============ 会员订阅 subscription ============ */

export interface AddSubscriptionInput {
  name: string;
  category: string;
  price: number;
  cycle: SubCycle;
  next_renewal: string; // ISO date
  auto_renew: number; // 0/1
  note: string;
}

export async function addSubscription(input: AddSubscriptionInput): Promise<void> {
  const db = await getDb();
  await db.run(
    `INSERT INTO subscriptions (name, category, price, cycle, next_renewal, auto_renew, status, note)
     VALUES (?, ?, ?, ?, ?, ?, 'active', ?)`,
    [input.name, input.category, input.price, input.cycle, input.next_renewal, input.auto_renew, input.note]
  );
  await persist();
}

export async function listSubscriptions(): Promise<Subscription[]> {
  const db = await getDb();
  const res = await db.query("SELECT * FROM subscriptions WHERE status='active' ORDER BY next_renewal ASC");
  return rows<Subscription>(res);
}

export async function cancelSubscription(id: number): Promise<void> {
  const db = await getDb();
  await db.run("UPDATE subscriptions SET status='cancelled' WHERE id=?", [id]);
  await persist();
}

export async function deleteSubscription(id: number): Promise<void> {
  const db = await getDb();
  await db.run('DELETE FROM subscriptions WHERE id=?', [id]);
  await persist();
}

/* ============ 资产 asset ============ */

export interface AddAssetInput {
  type: AssetType;
  name: string;
  category: string;
  value: number;
  note: string;
}

export async function addAsset(input: AddAssetInput): Promise<void> {
  const db = await getDb();
  const updated_at = new Date().toISOString();
  await db.run(
    `INSERT INTO assets (type, name, category, value, note, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [input.type, input.name, input.category, input.value, input.note, updated_at]
  );
  await persist();
}

export async function listAssets(): Promise<Asset[]> {
  const db = await getDb();
  const res = await db.query('SELECT * FROM assets ORDER BY id DESC');
  return rows<Asset>(res);
}

export async function updateAssetValue(id: number, value: number): Promise<void> {
  const db = await getDb();
  await db.run('UPDATE assets SET value=?, updated_at=? WHERE id=?', [
    value,
    new Date().toISOString(),
    id,
  ]);
  await persist();
}

export async function deleteAsset(id: number): Promise<void> {
  const db = await getDb();
  await db.run('DELETE FROM assets WHERE id=?', [id]);
  await persist();
}

/* ============ 首次 seed（各项独立判断空才写） ============ */

let seedPromise: Promise<void> | null = null;

export async function ensureSeed(): Promise<void> {
  if (seedPromise) return seedPromise;
  seedPromise = (async () => {
    // 消耗品（保留维达/可乐，但不再联动写入 expenses）
    if (await tableEmpty('consumption_items')) {
      const tissue = await addConsumptionItem({ name: '维达抽纸', category: '洗护', base_unit: '抽' });
      await addPurchase({ item_id: tissue, spec: '100抽×4包', price: 32.9, purchased_at: daysAgo(40) });
      await addPurchase({ item_id: tissue, spec: '100抽×4包', price: 39.9, purchased_at: daysAgo(8) });

      const cola = await addConsumptionItem({ name: '可口可乐', category: '餐饮', base_unit: 'ml' });
      await addPurchase({ item_id: cola, spec: '500ml×6瓶', price: 18.0, purchased_at: daysAgo(30) });
      await addPurchase({ item_id: cola, spec: '500ml×12瓶', price: 29.9, purchased_at: daysAgo(4) });
    }

    // 账单（独立日常开支）
    if (await tableEmpty('expenses')) {
      await addBill({ amount: 35, category: '餐饮', note: '午餐', created_at: daysAgo(2) });
      await addBill({ amount: 12, category: '交通', note: '地铁', created_at: daysAgo(1) });
      await addBill({ amount: 59, category: '娱乐', note: '电影', created_at: daysAgo(5) });
    }

    // 会员订阅
    if (await tableEmpty('subscriptions')) {
      await addSubscription({
        name: 'B站大会员',
        category: '视频',
        price: 148,
        cycle: 'yearly',
        next_renewal: daysAhead(30),
        auto_renew: 1,
        note: '',
      });
      await addSubscription({
        name: '网易云音乐',
        category: '音乐',
        price: 15,
        cycle: 'monthly',
        next_renewal: daysAhead(12),
        auto_renew: 1,
        note: '',
      });
      await addSubscription({
        name: 'iCloud+',
        category: '网盘',
        price: 6,
        cycle: 'monthly',
        next_renewal: daysAhead(5),
        auto_renew: 1,
        note: '',
      });
    }

    // 资产
    if (await tableEmpty('assets')) {
      await addAsset({ type: 'money', name: '微信零钱', category: '电子支付', value: 2500, note: '' });
      await addAsset({ type: 'money', name: '银行卡', category: '储蓄卡', value: 12000, note: '' });
      await addAsset({ type: 'physical', name: '笔记本电脑', category: '数码', value: 6500, note: '' });
      await addAsset({ type: 'physical', name: '相机', category: '数码', value: 4200, note: '' });
    }
  })();
  return seedPromise;
}
