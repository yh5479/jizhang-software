import { useEffect, useState } from 'react';
import { GlassCard } from '../components/GlassCard';
import { Modal } from '../components/Modal';
import { ProgressRing } from '../components/ProgressRing';
import { Icon } from '../components/icons';
import { addBill, listExpensesThisMonth, type AddBillInput } from '../db/repo';
import type { Expense } from '../types';
import {
  BILL_CATEGORIES,
  BILL_CAT_COLOR,
  MONTHLY_BUDGET,
} from '../logic/categories';

function fmtTime(iso: string): string {
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${d.getMonth() + 1}月${d.getDate()}日 ${hh}:${mm}`;
}

export function BillModal({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<string>(BILL_CATEGORIES[0]);
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    const amt = parseFloat(amount);
    if (Number.isNaN(amt) || amt <= 0) return window.alert('请输入有效金额');
    setSaving(true);
    try {
      const input: AddBillInput = {
        amount: amt,
        category,
        note: note.trim(),
        created_at: new Date(`${date}T12:00:00`).toISOString(),
      };
      await addBill(input);
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="记一笔" onClose={onClose}>
      <div className="field">
        <label>金额（元）</label>
        <input
          className="input tabular"
          type="number"
          inputMode="decimal"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>

      <div className="field">
        <label>品类</label>
        <div className="chip-row">
          {BILL_CATEGORIES.map((c) => (
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
        <label>日期</label>
        <input
          className="input"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      <div className="field">
        <label>备注</label>
        <textarea
          className="textarea"
          placeholder="买了什么…"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

      <button className="btn btn-primary btn-block" onClick={submit} disabled={saving}>
        {saving ? '保存中…' : '保存'}
      </button>
    </Modal>
  );
}

export function Bills({ refreshKey }: { refreshKey: number }) {
  const [month, setMonth] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBill, setShowBill] = useState(false);
  const [localKey, setLocalKey] = useState(0);

  useEffect(() => {
    let alive = true;
    (async () => {
      const m = await listExpensesThisMonth();
      if (!alive) return;
      setMonth(m);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [refreshKey, localKey]);

  const total = month.reduce((s, e) => s + e.amount, 0);
  const pct = MONTHLY_BUDGET > 0 ? total / MONTHLY_BUDGET : 0;

  // 本分类统计（只显示有金额的分类）
  const catStats = BILL_CATEGORIES.map((c) => ({
    cat: c,
    sum: month.filter((e) => e.category === c).reduce((s, e) => s + e.amount, 0),
  })).filter((x) => x.sum > 0);

  return (
    <>
      <GlassCard>
        <div className="ring-wrap">
          <ProgressRing
            value={pct}
            centerTop={`￥${total.toFixed(0)}`}
            centerSub={`预算 ${MONTHLY_BUDGET}`}
          />
          <div className="ring-stat">
            <span className="sub">本月支出</span>
            <span className="big tabular">￥{total.toFixed(2)}</span>
            <span className="sub">
              预算 ￥{MONTHLY_BUDGET} · 已用 {(pct * 100).toFixed(0)}%
            </span>
          </div>
        </div>
      </GlassCard>

      <GlassCard title="分类统计">
        {catStats.length === 0 ? (
          <div className="muted">本月暂无账单</div>
        ) : (
          <div className="chip-row" style={{ marginBottom: 0 }}>
            {catStats.map((x) => (
              <span key={x.cat} className="chip" style={{ background: BILL_CAT_COLOR[x.cat] }}>
                {x.cat} ￥{x.sum.toFixed(0)}
              </span>
            ))}
          </div>
        )}
      </GlassCard>

      <GlassCard title="账单明细">
        {loading ? (
          <div className="muted">加载中…</div>
        ) : month.length === 0 ? (
          <div className="empty">
            <div className="big">🧾</div>
            还没有账单，点下方记一笔
          </div>
        ) : (
          month.map((e) => (
            <div className="row" key={e.id}>
              <span className="dot" style={{ background: BILL_CAT_COLOR[e.category] || 'var(--c-income)' }} />
              <div className="grow">
                <div className="title">{e.note || e.category}</div>
                <div className="meta">
                  {e.category} · {fmtTime(e.created_at)}
                </div>
              </div>
              <div className="amount">￥{e.amount.toFixed(2)}</div>
            </div>
          ))
        )}
      </GlassCard>

      <button className="btn btn-primary btn-block" onClick={() => setShowBill(true)}>
        <Icon name="add" size={18} /> 记一笔
      </button>

      {showBill && (
        <BillModal
          onClose={() => setShowBill(false)}
          onSaved={() => setLocalKey((k) => k + 1)}
        />
      )}
    </>
  );
}
