import { useTheme } from '../theme/ThemeContext';
import { Icon } from './icons';

export function TopNav({ title }: { title: string }) {
  const { theme, toggle } = useTheme();
  return (
    <header className="top-nav">
      <h1>{title}</h1>
      <button className="icon-btn" onClick={toggle} aria-label="切换主题">
        <Icon name={theme === 'light' ? 'moon' : 'sun'} />
      </button>
    </header>
  );
}
