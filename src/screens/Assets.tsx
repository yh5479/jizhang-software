import { useEffect, useState } from 'react';
import { GlassCard } from '../components/GlassCard';
import { Modal } from '../components/Modal';
import { Icon } from '../components/icons';
import {
  addAsset,
  deleteAsset,
  listAssets,
  updateAssetValue,
  type AddAssetInput,
} from '../db/repo';
import type { Asset, AssetType } from '../types';
import { ASSET_MONEY_CATS, ASSET_PHYSICAL_CATS } from '../logic/categories';

const TYPE_LABEL: Record<AssetType, string> = { money: '金钱', physical: '实体' };

export function AssetModal({
  onClose,
  onSaved,
  editAsset,
}: {
  onClose: () => void;
  onSaved: () => void;
  editAsset?: Asset;
}) {
  const isEdit = !!editAsset;
  const [type, setType] = useState<AssetType>(editAsset?.type ?? 'money');
  const [name, setName] = useState(editAsset?.name ?? '');
  const [category, setCategory] = useState<string>(
    editAsset?.category ?? ASSET_MONEY_CATS[0]
  );
  const [value, setValue] = useState(editAsset ? String(editAsset.value) : '');
  const [note, setNote] = useState(editAsset?.note ?? '');
  const [saving, setSaving] = useState(false);

  const cats = type === 'money' ? ASSET_MONEY_CATS : ASSET_PHYSICAL_CATS;

  const submit = async () => {
    if (!name.trim()) return window.alert('请输入名称');
    const v = parseFloat(value);
    if (Number.isNaN(v)) return window.alert('请输入有效价值');
    setSaving(true);
    try {
      if (isEdit && editAsset) {
        await updateAssetValue(editAsset.id, v);
      } else {
        const input: AddAssetInput = {
          type,
          name: name.trim(),
          category,
          value: v,
          note: note.trim(),
        };
        await addAsset(input);
      }
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={isEdit ? '编辑资产价值' : '登记资产'} onClose={onClose}>
      {!isEdit && (
        <div className="field">
          <label>类型</label>
          <div className="chip-row">
            {(Object.keys(TYPE_LABEL) as AssetType[]).map((t) => (
              <button
                key={t}
                className={`chip ${type === t ? 'active' : ''}`}
                onClick={() => {
                  setType(t);
                  setCategory(t === 'money' ? ASSET_MONEY_CATS[0] : ASSET_PHYSICAL_CATS[0]);
                }}
              >
                {TYPE_LABEL[t]}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="field">
        <label>名称</label>
        <input
          className="input"
          placeholder="如 微信零钱"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isEdit}
        />
      </div>
      <div className="field">
        <label>分类</label>
        <div className="chip-row">
          {cats.map((c) => (
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
        <label>{isEdit ? '当前价值（元）' : '当前价值（元）'}</label>
        <input
          className="input tabular"
          type="number"
          inputMode="decimal"
          placeholder="0.00"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </div>
      <div className="field">
        <label>备注</label>
        <textarea
          className="textarea"
          placeholder="可选"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          disabled={isEdit}
        />
      </div>
      <button className="btn btn-primary btn-block" onClick={submit} disabled={saving}>
        {saving ? '保存中…' : '保存'}
      </button>
    </Modal>
  );
}

export function Assets({ refreshKey }: { refreshKey: number }) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editAsset, setEditAsset] = useState<Asset | null>(null);
  const [localKey, setLocalKey] = useState(0);

  useEffect(() => {
    let alive = true;
    (async () => {
      const list = await listAssets();
      if (!alive) return;
      setAssets(list);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [refreshKey, localKey]);

  const moneyAssets = assets.filter((a) => a.type === 'money');
  const physicalAssets = assets.filter((a) => a.type === 'physical');
  const moneySum = moneyAssets.reduce((s, a) => s + a.value, 0);
  const physicalSum = physicalAssets.reduce((s, a) => s + a.value, 0);
  const total = moneySum + physicalSum;

  const remove = async (id: number) => {
    if (!window.confirm('确定删除该资产？')) return;
    await deleteAsset(id);
    setLocalKey((k) => k + 1);
  };

  const renderGroup = (title: string, list: Asset[]) => (
    <GlassCard title={title}>
      {list.length === 0 ? (
        <div className="muted">暂无</div>
      ) : (
        list.map((a) => (
          <div
            className="row"
            key={a.id}
            style={{ cursor: 'pointer' }}
            onClick={() => setEditAsset(a)}
          >
            <div className="grow">
              <div className="title">{a.name}</div>
              <div className="meta">{a.category}</div>
            </div>
            <div className="amount tabular" style={{ fontSize: 15 }}>
              ￥{a.value.toFixed(2)}
            </div>
            <button
              className="icon-btn"
              onClick={(e) => {
                e.stopPropagation();
                remove(a.id);
              }}
              aria-label="删除"
            >
              <Icon name="close" size={16} />
            </button>
          </div>
        ))
      )}
    </GlassCard>
  );

  return (
    <>
      <GlassCard>
        <div className="title tabular" style={{ fontSize: 28 }}>
          ￥{total.toFixed(2)}
        </div>
        <div className="meta" style={{ marginTop: 6 }}>
          金钱资产 ￥{moneySum.toFixed(2)} · 实体资产 ￥{physicalSum.toFixed(2)}
        </div>
      </GlassCard>

      {loading ? (
        <div className="muted">加载中…</div>
      ) : (
        <>
          {renderGroup('金钱资产', moneyAssets)}
          {renderGroup('实体资产', physicalAssets)}
        </>
      )}

      <button className="btn btn-primary btn-block" onClick={() => setShowAdd(true)}>
        <Icon name="add" size={18} /> 登记资产
      </button>

      {showAdd && (
        <AssetModal
          onClose={() => setShowAdd(false)}
          onSaved={() => setLocalKey((k) => k + 1)}
        />
      )}

      {editAsset && (
        <AssetModal
          editAsset={editAsset}
          onClose={() => setEditAsset(null)}
          onSaved={() => {
            setEditAsset(null);
            setLocalKey((k) => k + 1);
          }}
        />
      )}
    </>
  );
}
