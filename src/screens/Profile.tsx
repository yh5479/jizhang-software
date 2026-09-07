import { useTheme } from '../theme/ThemeContext';
import { GlassCard } from '../components/GlassCard';
import { Icon } from '../components/icons';

export function Profile() {
  const { theme, toggle } = useTheme();
  return (
    <>
      <GlassCard>
        <div className="flex-between">
          <span className="avatar-card">
            <Icon name="user" size={32} />
          </span>
          <div className="grow" style={{ paddingLeft: 14 }}>
            <div className="title" style={{ fontSize: 18 }}>
              主人
            </div>
            <div className="meta">本地数据 · 仅本机保存</div>
          </div>
        </div>
      </GlassCard>

      <GlassCard title="外观">
        <div className="flex-between">
          <div>
            <div
              style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-on-glass)' }}
            >
              深色模式
            </div>
            <div className="muted">切换 Spotify 能量暗色</div>
          </div>
          <button className="chip" onClick={toggle}>
            {theme === 'light' ? '开启' : '关闭'}
          </button>
        </div>
      </GlassCard>

      <GlassCard title="关于">
        <div className="row">
          <span className="dot" style={{ background: 'var(--primary)' }} />
          <div className="grow">
            <div className="title">消耗品 · 账单 · 会员 · 资产</div>
            <div className="meta">v1.0 · 本地数据 · SQLite</div>
          </div>
        </div>
        <div className="muted" style={{ marginTop: 8, lineHeight: 1.6 }}>
          专注四类个人财务：消耗品比价、日常账单、会员订阅、资产管理。所有数据仅存于本机：Web
          端写入 IndexedDB，安卓端写入系统 SQLite，均通过 @capacitor-community/sqlite 真实持久化。
        </div>
      </GlassCard>

      <GlassCard title="隐私">
        <div className="muted" style={{ lineHeight: 1.6 }}>
          本应用不联网、不上传任何数据。卸载或清除浏览器数据会一并清除本地记录。
        </div>
      </GlassCard>
    </>
  );
}
