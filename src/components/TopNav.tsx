import { useTheme } from '../theme/ThemeContext';
import { Icon } from './icons';

export function TopNav({ title, onProfile }: { title: string; onProfile?: () => void }) {
  const { theme, toggle } = useTheme();
  return (
    <header className="top-nav">
      {onProfile ? (
        <button className="avatar-btn" onClick={onProfile} aria-label="我的">
          <Icon name="user" size={20} />
        </button>
      ) : (
        <span />
      )}
      <h1>{title}</h1>
      <button className="icon-btn" onClick={toggle} aria-label="切换主题">
        <Icon name={theme === 'light' ? 'moon' : 'sun'} />
      </button>
    </header>
  );
}
