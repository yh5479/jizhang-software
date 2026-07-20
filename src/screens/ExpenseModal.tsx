import { useEffect, useState } from 'react';
import { Modal } from '../components/Modal';
import { addExpense, listItemsByCategory } from '../db/repo';
import { CATEGORIES } from '../logic/categories';
import type { ConsumptionItem } from '../types';

export function ExpenseModal({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [note, setNote] = useState('');
  const [itemId, setItemId] = useState<number | null>(null);
  const [items, setItems] = useState<ConsumptionItem[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => setItems(await listItemsByCategory()))();
  }, []);

  const submit = async () => {
    const amt = parseFloat(amount);
    if (Number.isNaN(amt) || amt <= 0) {
      window.alert('请输入有效金额');
      return;
    }
    setSaving(true);
    try {
      await addExpense({
        amount: amt,
        category,
        note: note.trim(),
        consumption_item_id: itemId,
      });
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
        <label>关联消耗品（可选）</label>
        <select
          className="select"
          value={itemId ?? ''}
          onChange={(e) => setItemId(e.target.value ? Number(e.target.value) : null)}
        >
          <option value="">不关联</option>
          {items.map((it) => (
            <option key={it.id} value={it.id}>
              {it.name}
            </option>
          ))}
        </select>
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
