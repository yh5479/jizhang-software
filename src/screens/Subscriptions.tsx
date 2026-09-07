import { useEffect, useState } from 'react';
import { GlassCard } from '../components/GlassCard';
import { Modal } from '../components/Modal';
import { Icon } from '../components/icons';
import {
  addSubscription,
  deleteSubscription,
  listSubscriptions,
  type AddSubscriptionInput,
} from '../db/repo';
import type { Subscription, SubCycle } from '../types';
import { SUB_CATEGORIES } from '../logic/categories';
import { CYCLE_LABEL, daysUntil, monthlyCost } from '../logic/subs';

const CYCLES: SubCycle[] = ['monthly', 'quarterly', 'semiannual', 'yearly'];

export function SubscriptionModal({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<string>(SUB_CATEGORIES[0]);
  const [price, setPrice] = useState('');
  const [cycle, setCycle] = useState<SubCycle>('monthly');
  const [nextRenewal, setNextRenewal] = useState(new Date().toISOString().slice(0, 10));
  const [autoRenew, setAutoRenew] = useState(true);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!name.trim()) return window.alert('请输入订阅名称');
    const p = parseFloat(price);
    if (Number.isNaN(p) || p <= 0) return window.alert('请输入有效价格');
    setSaving(true);
    try {
      const input: AddSubscriptionInput = {
        name: name.trim(),
        category,
        price: p,
        cycle,
        next_renewal: new Date(`${nextRenewal}T12:00:00`).toISOString(),
        auto_renew: autoRenew ? 1 : 0,
        note: '',
      };
      await addSubscription(input);
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="添加订阅" onClose={onClose}>
      <div className="field">
        <label>名称</label>
        <input
          className="input"
          placeholder="如 B站大会员"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className="field">
        <label>品类</label>
        <div className="chip-row">
          {SUB_CATEGORIES.map((c) => (
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
        <label>价格（元/周期）</label>
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
        <label>计费周期</label>
        <div className="chip-row">
          {CYCLES.map((c) => (
            <button
              key={c}
              className={`chip ${cycle === c ? 'active' : ''}`}
              onClick={() => setCycle(c)}
            >
              {CYCLE_LABEL[c]}
            </button>
          ))}
        </div>
      </div>
      <div className="field">
        <label>下次续费日</label>
        <input
          className="input"
          type="date"
          value={nextRenewal}
          onChange={(e) => setNextRenewal(e.target.value)}
        />
      </div>
      <div className="field">
        <div className="chip-row" style={{ marginBottom: 0 }}>
          <button
            className={`chip ${autoRenew ? 'active' : ''}`}
            onClick={() => setAutoRenew((v) => !v)}
          >
            自动续费{autoRenew ? '：开' : '：关'}
          </button>
        </div>
      </div>
      <button className="btn btn-primary btn-block" onClick={submit} disabled={saving}>
        {saving ? '保存中…' : '保存'}
      </button>
    </Modal>
  );
}

export function Subscriptions({ refreshKey }: { refreshKey: number }) {
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [localKey, setLocalKey] = useState(0);

  useEffect(() => {
    let alive = true;
    (async () => {
      const list = await listSubscriptions();
      if (!alive) return;
      setSubs(list);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [refreshKey, localKey]);

  const monthlyTotal = subs.reduce((s, x) => s + monthlyCost(x), 0);
  const yearlyTotal = monthlyTotal * 12;

  const remove = async (id: number) => {
    if (!window.confirm('确定删除该订阅？')) return;
    await deleteSubscription(id);
    setLocalKey((k) => k + 1);
  };

  return (
    <>
      <GlassCard>
        <div className="flex-between">
          <div>
            <div className="meta">月均订阅成本</div>
            <div className="title tabular" style={{ fontSize: 28 }}>
              ￥{monthlyTotal.toFixed(2)}
            </div>
          </div>
          <div className="muted" style={{ textAlign: 'right' }}>
            每年约 ￥{yearlyTotal.toFixed(0)}
          </div>
        </div>
      </GlassCard>

      <GlassCard title="我的订阅">
        {loading ? (
          <div className="muted">加载中…</div>
        ) : subs.length === 0 ? (
          <div className="empty">
            <div className="big">💳</div>
            还没有订阅，点下方添加
          </div>
        ) : (
          subs.map((s) => {
            const left = daysUntil(s.next_renewal);
            const soon = left <= 7;
            return (
              <div className="row" key={s.id}>
                <div className="grow">
                  <div className="title">{s.name}</div>
                  <div className="meta">
                    <span className="chip" style={{ background: 'var(--tab-active-bg)', marginRight: 6 }}>
                      {s.category}
                    </span>
                    ￥{s.price}/{CYCLE_LABEL[s.cycle]} · 剩 {Math.max(0, left)} 天
                  </div>
                </div>
                {soon && <span className="badge expensive">即将续费</span>}
                <button className="icon-btn" onClick={() => remove(s.id)} aria-label="删除">
                  <Icon name="close" size={16} />
                </button>
              </div>
            );
          })
        )}
      </GlassCard>

      <button className="btn btn-primary btn-block" onClick={() => setShowAdd(true)}>
        <Icon name="add" size={18} /> 添加订阅
      </button>

      {showAdd && (
        <SubscriptionModal
          onClose={() => setShowAdd(false)}
          onSaved={() => setLocalKey((k) => k + 1)}
        />
      )}
    </>
  );
}
