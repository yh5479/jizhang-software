import type { BarRow } from '../logic/compare';

export function BarCompare({ rows }: { rows: BarRow[] }) {
  if (!rows.length) return <div className="muted">暂无购买记录</div>;
  return (
    <div>
      {rows.map((r, i) => (
        <div className="bar-row" key={i}>
          <div className="bar-label">{r.label}</div>
          <div className="bar-track">
            <div
              className={`bar-fill ${r.tone}`}
              style={{ width: `${Math.max(8, r.widthPct)}%` }}
            />
          </div>
          <div className={`bar-delta ${r.tone === 'up' ? 'up' : r.tone === 'down' ? 'down' : 'flat'}`}>
            {r.deltaText}
          </div>
        </div>
      ))}
    </div>
  );
}
