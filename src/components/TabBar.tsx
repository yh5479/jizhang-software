import { Icon } from './icons';

export type TabKey = 'consumables' | 'bills' | 'subs' | 'assets' | 'profile';

const SIDE: { key: TabKey; label: string; icon: 'tag' | 'receipt' | 'card' | 'chart' }[] = [
  { key: 'consumables', label: '消耗品', icon: 'tag' },
  { key: 'bills', label: '账单', icon: 'receipt' },
  { key: 'subs', label: '会员', icon: 'card' },
  { key: 'assets', label: '资产', icon: 'chart' },
];

export function TabBar({
  active,
  onChange,
  onAdd,
}: {
  active: TabKey;
  onChange: (k: TabKey) => void;
  onAdd: () => void;
}) {
  // 顺序：消耗品、账单、[中心添加]、会员、资产
  const left = SIDE.slice(0, 2);
  const right = SIDE.slice(2);
  return (
    <nav className="tab-bar">
      {left.map((t) => (
        <button
          key={t.key}
          className={`tab-item ${active === t.key ? 'active' : ''}`}
          onClick={() => onChange(t.key)}
        >
          <Icon name={t.icon} size={20} />
          <span className="tab-label">{t.label}</span>
        </button>
      ))}
      <button className="tab-add" onClick={onAdd} aria-label="添加">
        <Icon name="plus" size={28} />
      </button>
      {right.map((t) => (
        <button
          key={t.key}
          className={`tab-item ${active === t.key ? 'active' : ''}`}
          onClick={() => onChange(t.key)}
        >
          <Icon name={t.icon} size={20} />
          <span className="tab-label">{t.label}</span>
        </button>
      ))}
    </nav>
  );
}
