import type { ReactNode } from 'react';
import { Icon } from './icons';

export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle" />
        <button className="icon-btn modal-close" onClick={onClose} aria-label="关闭">
          <Icon name="close" size={18} />
        </button>
        <div className="modal-title">{title}</div>
        {children}
      </div>
    </div>
  );
}
