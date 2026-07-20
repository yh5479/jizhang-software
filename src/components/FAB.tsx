import { Icon } from './icons';

export function FAB({ onClick }: { onClick: () => void }) {
  return (
    <button className="fab" onClick={onClick} aria-label="记一笔">
      <Icon name="plus" size={35} />
    </button>
  );
}
