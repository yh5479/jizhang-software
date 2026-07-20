import type { ReactNode } from 'react';

export function GlassCard({
  title,
  children,
  className,
}: {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`glass-card ${className ?? ''}`}>
      {title && <div className="card-title">{title}</div>}
      {children}
    </div>
  );
}
