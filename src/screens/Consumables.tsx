import { useEffect, useState } from 'react';
import { GlassCard } from '../components/GlassCard';
import { Modal } from '../components/Modal';
import { BarCompare } from '../components/BarCompare';
import { Icon } from '../components/icons';
import {
  addConsumptionItem,
  addPurchase,
  getItemComparison,
  listItemSummaries,
  listPurchasesThisMonth,
  type ItemSummary,
} from '../db/repo';
import type { ComparedPurchase, ItemComparison } from '../logic/compare';
import { buildBars } from '../logic/compare';
import { buildPreviewText } from '../logic/unit';
import { CATEGORIES, CAT_COLOR } from '../logic/categories';
import type { Purchase } from '../types';

const FILTERS = ['全部', ...CATEGORIES];
const todayStr = () => new Date().toISOString().slice(0, 10);

/* ---------- 添加购买 ---------- */
function AddPurchaseModal({
  itemId,
  itemName,
  onClose,
  onSaved,
}: {
  itemId: number;
  itemName: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [spec, setSpec] = useState('');
  const [price, setPrice] = useState('');
  const [date, setDate] = useState(todayStr());
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    const p = parseFloat(price);
    if (Number.isNaN(p) || p <= 0) return window.alert('请输入有效价格');
    if (!spec.trim()) return window.alert('请输入规格');
    setSaving(true);
    try {
      await addPurchase({
        item_id: itemId,
        spec: spec.trim(),
        price: p,
        purchased_at: new Date(`${date}T12:00:00`).toISOString(),
      });
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={`添加购买 · ${itemName}`} onClose={onClose}>
      <div className="field">
        <label>规格（如 100抽×4包 / 500ml / 1.5kg）</label>
        <input
          className="input"
          placeholder="100抽×4包"
          value={spec}
          onChange={(e) => setSpec(e.target.value)}
        />
        <div className="preview">{buildPreviewText(price, spec)}</div>
      </div>
      <div className="field">
        <label>价格（元）</label>
        <input
          className="input tabular"
          type="number"
          inputMode="decimal"
          placeholder="0.00"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
      </div>
      <div className="field">
        <label>购买日期</label>
        <input
          className="input"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>
      <button className="btn btn-primary btn-block" onClick={submit} disabled={saving}>
        {saving ? '保存中…' : '保存购买'}
      </button>
    </Modal>
  );
}

/* ---------- 新建消耗品 ---------- */
function NewItemModal({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [baseUnit, setBaseUnit] = useState('份');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!name.trim()) return window.alert('请输入商品名');
    setSaving(true);
    try {
      await addConsumptionItem({
        name: name.trim(),
        category,
        base_unit: baseUnit.trim() || '份',
      });
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="新建消耗品" onClose={onClose}>
      <div className="field">
        <label>商品名</label>
        <input
          className="input"
          placeholder="如 维达抽纸"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className="field">
        <label>品类</label>
        <div className="chip-row">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              className={`chip ${category === c ? 'active' : ''}`}
              onClick={() => setCategory(c)}
            >
              {c}
            </button>
          ))}
        </div>
      </div>
      <div className="field">
        <label>基本单位（默认「份」，如 抽/ml/kg）</label>
        <input
          className="input"
          placeholder="抽"
          value={baseUnit}
          onChange={(e) => setBaseUnit(e.target.value)}
        />
      </div>
      <button className="btn btn-primary btn-block" onClick={submit} disabled={saving}>
        {saving ? '创建中…' : '创建'}
      </button>
    </Modal>
  );
}

/* ---------- 单品详情 ---------- */
function deltaLabel(p: ComparedPurchase): { text: string; cls: string } {
  if (p.deltaPct === null) return { text: '首次', cls: '' };
  const up = !p.cheaper;
  const cls = up ? 'up' : 'down';
  const word = up ? '贵' : '便宜';
  return { text: `${word} ${Math.abs(p.deltaPct).toFixed(0)}%`, cls };
}

function ItemDetailModal({
  itemId,
  onClose,
  onChanged,
}: {
  itemId: number;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [item, setItem] = useState<{ id: number; name: string; category: string; base_unit: string } | undefined>();
  const [comparison, setComparison] = useState<ItemComparison | undefined>();
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const load = async () => {
    const { item, comparison } = await getItemComparison(itemId);
    setItem(item);
    setComparison(comparison);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemId]);

  if (loading || !comparison) {
    return (
      <Modal title="加载中" onClose={onClose}>
        <div className="muted">…</div>
      </Modal>
    );
  }

  const bars = buildBars(comparison);
  const unitLabel = comparison.purchases[0]?.unit_label ?? '元/份';

  return (
    <Modal title={item?.name ?? '消耗品'} onClose={onClose}>
      <div className="flex-between" style={{ marginBottom: 14 }}>
        <span className="chip" style={{ background: CAT_COLOR[item?.category ?? '其它'] }}>
          {item?.category}
        </span>
        <span className={`badge ${comparison.verdict}`}>{comparison.verdictText}</span>
      </div>

      <GlassCard>
        <div className="flex-between">
          <div>
            <div className="meta">最近单价</div>
            <div className="title tabular" style={{ fontSize: 20 }}>
              ￥{comparison.latestUnitPrice.toFixed(3)}
              <span className="muted" style={{ fontSize: 12, fontWeight: 400 }}>
                {' '}
                {unitLabel}
              </span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="meta">历史最低 / 平均</div>
            <div className="title tabular" style={{ fontSize: 15 }}>
              ￥{comparison.minUnitPrice.toFixed(3)} / ￥{comparison.avgUnitPrice.toFixed(3)}
            </div>
          </div>
        </div>
      </GlassCard>

      <GlassCard title="可比单价对比（最低为基准）">
        <BarCompare rows={bars} />
      </GlassCard>

      <GlassCard title={`购买记录（${comparison.purchases.length}）`}>
        {comparison.purchases.map((p) => {
          const d = deltaLabel(p);
          return (
            <div className="row" key={p.id}>
              <div className="grow">
                <div className="title">{p.spec}</div>
                <div className="meta">
                  ￥{p.price.toFixed(2)} · {p.purchased_at.slice(0, 10)}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="amount tabular" style={{ fontSize: 15 }}>
                  ￥{p.unit_price.toFixed(3)}
                </div>
                <div
                  className="meta"
                  style={{ color: d.cls === 'up' ? '#d6204a' : d.cls === 'down' ? '#1a9e3e' : undefined }}
                >
                  {d.text}
                </div>
              </div>
            </div>
          );
        })}
      </GlassCard>

      <button className="btn btn-primary btn-block" onClick={() => setShowAdd(true)}>
        <Icon name="add" size={18} /> 添加购买
      </button>

      {showAdd && (
        <AddPurchaseModal
          itemId={itemId}
          itemName={item?.name ?? ''}
          onClose={() => setShowAdd(false)}
          onSaved={() => {
            setShowAdd(false);
            setLoading(true);
            load();
            onChanged();
          }}
        />
      )}
    </Modal>
  );
}

/* ---------- 主列表 ---------- */
export function Consumables({ refreshKey }: { refreshKey: number }) {
  const [filter, setFilter] = useState('全部');
  const [summaries, setSummaries] = useState<ItemSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailId, setDetailId] = useState<number | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [monthSum, setMonthSum] = useState(0);
  const [monthCount, setMonthCount] = useState(0);

  const load = async () => {
    setLoading(true);
    setSummaries(await listItemSummaries(filter));
    const month: Purchase[] = await listPurchasesThisMonth();
    setMonthSum(month.reduce((s, p) => s + p.price, 0));
    setMonthCount(month.length);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, refreshKey]);

  return (
    <>
      <GlassCard>
        <div className="flex-between">
          <div>
            <div className="meta">本月消耗品支出</div>
            <div className="title tabular" style={{ fontSize: 28 }}>
              ￥{monthSum.toFixed(2)}
            </div>
          </div>
          <div className="muted" style={{ textAlign: 'right' }}>
            共 {monthCount} 次购买
          </div>
        </div>
      </GlassCard>

      <div className="chip-row">
        {FILTERS.map((f) => (
          <button
            key={f}
            className={`chip ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="muted">加载中…</div>
      ) : summaries.length === 0 ? (
        <div className="empty">
          <div className="big">🛒</div>
          还没有消耗品，点右上「新建」开始比价
        </div>
      ) : (
        summaries.map((s) => (
          <GlassCard key={s.item.id}>
            <div
              className="row"
              style={{ cursor: 'pointer', padding: 0, border: 'none' }}
              onClick={() => setDetailId(s.item.id)}
            >
              <span className="dot" style={{ background: CAT_COLOR[s.item.category] }} />
              <div className="grow">
                <div className="title">{s.item.name}</div>
                <div className="meta">
                  {s.item.category} · {s.lastSpec || '暂无购买'}
                </div>
              </div>
              <div style={{ textAlign: 'right', marginRight: 6 }}>
                <div className="amount tabular" style={{ fontSize: 15 }}>
                  {s.purchaseCount > 0 ? `￥${s.latestUnitPrice.toFixed(3)}` : '—'}
                </div>
                <div className="meta">{s.purchaseCount} 次</div>
              </div>
              <span className={`badge ${s.verdict}`}>{s.verdictText}</span>
              <Icon name="chevron" size={18} style={{ color: 'var(--text-secondary)' }} />
            </div>
          </GlassCard>
        ))
      )}

      <button
        className="btn btn-block"
        onClick={() => setShowNew(true)}
        style={{ marginTop: 14 }}
      >
        <Icon name="add" size={18} /> 新建消耗品
      </button>

      {detailId !== null && (
        <ItemDetailModal
          itemId={detailId}
          onClose={() => setDetailId(null)}
          onChanged={load}
        />
      )}

      {showNew && (
        <NewItemModal
          onClose={() => setShowNew(false)}
          onSaved={() => {
            setShowNew(false);
            setFilter('全部');
            load();
          }}
        />
      )}
    </>
  );
}
