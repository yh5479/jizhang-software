import { getDb, persist } from './db';
import type { ConsumptionItem, Expense, Purchase } from '../types';
import { parseSpec } from '../logic/unit';
import { buildComparison, type ItemComparison, type Verdict } from '../logic/compare';

function rows<T>(res: { values?: any[] } | null | undefined): T[] {
  return ((res && res.values) || []) as T[];
}

function daysAgo(n: number): string {
  return new Date(Date.now() - n * 86_400_000).toISOString();
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

/* ============ 首次 seed（仅一次） ============ */

let seedPromise: Promise<void> | null = null;

export async function ensureSeed(): Promise<void> {
  if (seedPromise) return seedPromise;
  seedPromise = (async () => {
    const items = await listItemsByCategory();
    if (items.length > 0) return;

  // 维达抽纸（洗护）：第一次更便宜，第二次涨价 -> 偏贵演示
  const tissue = await addConsumptionItem({ name: '维达抽纸', category: '洗护', base_unit: '抽' });
  await addPurchase({ item_id: tissue, spec: '100抽×4包', price: 32.9, purchased_at: daysAgo(40) });
  await addPurchase({ item_id: tissue, spec: '100抽×4包', price: 39.9, purchased_at: daysAgo(8) });
  await addExpense({
    amount: 39.9,
    category: '洗护',
    note: '维达抽纸 100抽×4包',
    consumption_item_id: tissue,
    created_at: daysAgo(8),
  });

  // 可口可乐（餐饮）：大包装更划算 -> 现在买很划算演示
  const cola = await addConsumptionItem({ name: '可口可乐', category: '餐饮', base_unit: 'ml' });
  await addPurchase({ item_id: cola, spec: '500ml×6瓶', price: 18.0, purchased_at: daysAgo(30) });
  await addPurchase({ item_id: cola, spec: '500ml×12瓶', price: 29.9, purchased_at: daysAgo(4) });
  await addExpense({
    amount: 29.9,
    category: '餐饮',
    note: '可口可乐 500ml×12瓶',
    consumption_item_id: cola,
    created_at: daysAgo(4),
  });
  })();
  return seedPromise;
}
