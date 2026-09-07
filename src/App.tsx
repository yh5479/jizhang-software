import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { ThemeProvider } from './theme/ThemeContext';
import { TopNav } from './components/TopNav';
import { TabBar, type TabKey } from './components/TabBar';
import { AddMenu } from './components/AddMenu';
import { Consumables } from './screens/Consumables';
import { Bills, BillModal } from './screens/Bills';
import { Subscriptions, SubscriptionModal } from './screens/Subscriptions';
import { Assets, AssetModal } from './screens/Assets';
import { Profile } from './screens/Profile';
import { initDatabase } from './db/db';
import { ensureSeed } from './db/repo';

const IS_NATIVE = Capacitor.isNativePlatform();

const TITLES: Record<TabKey, string> = {
  consumables: '消耗品',
  bills: '账单',
  subs: '会员',
  assets: '资产',
  profile: '我的',
};

function Shell() {
  const [screen, setScreen] = useState<TabKey>('consumables');
  const [addOpen, setAddOpen] = useState(false);
  const [billOpen, setBillOpen] = useState(false);
  const [subOpen, setSubOpen] = useState(false);
  const [assetOpen, setAssetOpen] = useState(false);
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
    <div className={`phone ${IS_NATIVE ? 'native' : ''}`}>
      <div className="screen">
        <div className="blobs">
          <div className="blob b1" />
          <div className="blob b2" />
        </div>

        {!IS_NATIVE && (
          <div className="status-bar">
            <span>9:41</span>
            <span className="icons">
              <span style={{ fontSize: 11 }}>●●●</span>
              <span style={{ fontSize: 11 }}>WiFi</span>
              <span style={{ fontSize: 11 }}>100%</span>
            </span>
          </div>
        )}

        <TopNav title={TITLES[screen]} onProfile={() => setScreen('profile')} />

        <main className="screen-content">
          {screen === 'consumables' && <Consumables refreshKey={refreshKey} />}
          {screen === 'bills' && <Bills refreshKey={refreshKey} />}
          {screen === 'subs' && <Subscriptions refreshKey={refreshKey} />}
          {screen === 'assets' && <Assets refreshKey={refreshKey} />}
          {screen === 'profile' && <Profile />}
        </main>

        <TabBar active={screen} onChange={setScreen} onAdd={() => setAddOpen(true)} />
        {!IS_NATIVE && <div className="home-indicator" />}

        {addOpen && (
          <AddMenu
            onClose={() => setAddOpen(false)}
            onPick={(type) => {
              setAddOpen(false);
              if (type === 'bill') setBillOpen(true);
              else if (type === 'sub') setSubOpen(true);
              else if (type === 'asset') setAssetOpen(true);
              else if (type === 'purchase') setScreen('consumables');
            }}
          />
        )}

        {billOpen && (
          <BillModal onClose={() => setBillOpen(false)} onSaved={bump} />
        )}
        {subOpen && (
          <SubscriptionModal onClose={() => setSubOpen(false)} onSaved={bump} />
        )}
        {assetOpen && (
          <AssetModal onClose={() => setAssetOpen(false)} onSaved={bump} />
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
