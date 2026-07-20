import { Icon } from './icons';

export type TabKey = 'home' | 'compare' | 'me';

const TABS: { key: TabKey; label: string; icon: 'home' | 'compare' | 'user' }[] = [
  { key: 'home', label: '首页', icon: 'home' },
  { key: 'compare', label: '比价', icon: 'compare' },
  { key: 'me', label: '我的', icon: 'user' },
];

export function TabBar({
  active,
  onChange,
}: {
  active: TabKey;
  onChange: (k: TabKey) => void;
}) {
  return (
    <nav className="tab-bar">
      {TABS.map((t) => (
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
