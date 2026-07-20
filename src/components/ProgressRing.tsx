import { useId } from 'react';

export function ProgressRing({
  value,
  size = 108,
  stroke = 12,
  centerTop,
  centerSub,
}: {
  value: number; // 0-1
  size?: number;
  stroke?: number;
  centerTop: string;
  centerSub?: string;
}) {
  const gid = useId();
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, value));
  const offset = c * (1 - pct);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FF2D55" />
          <stop offset="35%" stopColor="#FF9500" />
          <stop offset="60%" stopColor="#FFCC00" />
          <stop offset="100%" stopColor="#34C759" />
        </linearGradient>
      </defs>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--glass-border)"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={`url(#${gid})`}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset .6s cubic-bezier(.22,1,.36,1)' }}
      />
      <text
        x="50%"
        y="47%"
        textAnchor="middle"
        fontSize="23"
        fontWeight="700"
        fill="var(--text-on-glass)"
        style={{ fontVariantNumeric: 'tabular-nums' }}
      >
        {centerTop}
      </text>
      {centerSub && (
        <text
          x="50%"
          y="63%"
          textAnchor="middle"
          fontSize="11"
          fill="var(--text-secondary)"
        >
          {centerSub}
        </text>
      )}
    </svg>
  );
}
