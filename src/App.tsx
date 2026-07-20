import { useEffect, useState } from 'react';
import { ThemeProvider } from './theme/ThemeContext';
import { TopNav } from './components/TopNav';
import { TabBar, type TabKey } from './components/TabBar';
import { FAB } from './components/FAB';
import { Home } from './screens/Home';
import { Compare } from './screens/Compare';
import { Settings } from './screens/Settings';
import { ExpenseModal } from './screens/ExpenseModal';
import { initDatabase } from './db/db';
import { ensureSeed } from './db/repo';

const TITLES: Record<TabKey, string> = {
  home: '记账',
  compare: '比价',
  me: '我的',
};

function Shell() {
  const [tab, setTab] = useState<TabKey>('home');
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        await initDatabase();
        await ensureSeed();
        setReady(true);
      } catch (e) {
        console.error(e);
        setError(e instanceof Error ? e.message : String(e));
      }
    })();
  }, []);

  if (error) {
    return <div className="boot">数据库初始化失败：{error}</div>;
  }
  if (!ready) {
    return <div className="boot">正在初始化本地数据库…</div>;
  }

  const bump = () => setRefreshKey((k) => k + 1);

  return (
    <div className="phone">
      <div className="screen">
        <div className="blobs">
          <div className="blob b1" />
          <div className="blob b2" />
        </div>

        <div className="status-bar">
          <span>9:41</span>
          <span className="icons">
            <span style={{ fontSize: 11 }}>●●●</span>
            <span style={{ fontSize: 11 }}>WiFi</span>
            <span style={{ fontSize: 11 }}>100%</span>
          </span>
        </div>

        <TopNav title={TITLES[tab]} />

        <main className="screen-content">
          {tab === 'home' && <Home refreshKey={refreshKey} />}
          {tab === 'compare' && <Compare refreshKey={refreshKey} />}
          {tab === 'me' && <Settings />}
        </main>

        <TabBar active={tab} onChange={setTab} />
        <FAB onClick={() => setExpenseOpen(true)} />
        <div className="home-indicator" />

        {expenseOpen && (
          <ExpenseModal onClose={() => setExpenseOpen(false)} onSaved={bump} />
        )}
      </div>
    </div>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <Shell />
    </ThemeProvider>
  );
}
