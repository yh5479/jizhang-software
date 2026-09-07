import type { IconName } from './icons';
import { Icon } from './icons';
import { Modal } from './Modal';

export type AddType = 'purchase' | 'bill' | 'sub' | 'asset';

const OPTIONS: { type: AddType; icon: IconName; name: string; sub: string }[] = [
  { type: 'purchase', icon: 'tag', name: '记消耗品', sub: '记录一次购买，自动比价' },
  { type: 'bill', icon: 'receipt', name: '记账单', sub: '日常开支记一笔' },
  { type: 'sub', icon: 'card', name: '加会员', sub: '管理订阅与续费' },
  { type: 'asset', icon: 'chart', name: '加资产', sub: '登记金钱或实体资产' },
];

export function AddMenu({
  onClose,
  onPick,
}: {
  onClose: () => void;
  onPick: (type: AddType) => void;
}) {
  return (
    <Modal title="添加" onClose={onClose}>
      {OPTIONS.map((o) => (
        <button className="add-option" key={o.type} onClick={() => onPick(o.type)}>
          <span className="add-option-icon">
            <Icon name={o.icon} size={20} />
          </span>
          <div className="grow">
            <div className="title">{o.name}</div>
            <div className="meta">{o.sub}</div>
          </div>
          <Icon name="chevron" size={18} style={{ color: 'var(--text-secondary)' }} />
        </button>
      ))}
    </Modal>
  );
}
