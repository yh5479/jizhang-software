import { useEffect, useState } from 'react';
import { GlassCard } from '../components/GlassCard';
import { ProgressRing } from '../components/ProgressRing';
import { listExpensesRecent, listExpensesThisMonth } from '../db/repo';
import type { Expense } from '../types';
import { CAT_COLOR, MONTHLY_BUDGET } from '../logic/categories';

function fmtTime(iso: string): string {
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${d.getMonth() + 1}月${d.getDate()}日 ${hh}:${mm}`;
}

export function Home({ refreshKey }: { refreshKey: number }) {
  const [month, setMonth] = useState<Expense[]>([]);
  const [recent, setRecent] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      const m = await listExpensesThisMonth();
      const r = await listExpensesRecent(12);
      if (!alive) return;
      setMonth(m);
      setRecent(r);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [refreshKey]);

  const total = month.reduce((s, e) => s + e.amount, 0);
  const pct = MONTHLY_BUDGET > 0 ? total / MONTHLY_BUDGET : 0;

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

      <GlassCard title="最近记录">
        {loading ? (
          <div className="muted">加载中…</div>
        ) : recent.length === 0 ? (
          <div className="empty">
            <div className="big">🧾</div>
            还没有记账，点下方 + 记一笔
          </div>
        ) : (
          recent.map((e) => (
            <div className="row" key={e.id}>
              <span
                className="dot"
                style={{ background: CAT_COLOR[e.category] || 'var(--c-income)' }}
              />
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
    </>
  );
}
