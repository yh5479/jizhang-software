import { Capacitor } from '@capacitor/core';
import {
  CapacitorSQLite,
  SQLiteConnection,
  type SQLiteDBConnection,
} from '@capacitor-community/sqlite';

const DB_NAME = 'consumption_tracker';

let sqlite: SQLiteConnection | null = null;
let dbConn: SQLiteDBConnection | null = null;
let initPromise: Promise<SQLiteDBConnection> | null = null;

function getManager(): SQLiteConnection {
  if (!sqlite) sqlite = new SQLiteConnection(CapacitorSQLite);
  return sqlite;
}

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    amount REAL NOT NULL,
    category TEXT NOT NULL,
    note TEXT,
    created_at TEXT NOT NULL,
    consumption_item_id INTEGER
  )`,
  `CREATE TABLE IF NOT EXISTS consumption_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    base_unit TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS purchases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id INTEGER NOT NULL,
    spec TEXT NOT NULL,
    total_units REAL NOT NULL,
    unit_label TEXT NOT NULL,
    price REAL NOT NULL,
    unit_price REAL NOT NULL,
    purchased_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price REAL NOT NULL,
    cycle TEXT NOT NULL,
    next_renewal TEXT NOT NULL,
    auto_renew INTEGER DEFAULT 1,
    status TEXT DEFAULT 'active',
    note TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS assets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    value REAL NOT NULL,
    note TEXT,
    updated_at TEXT NOT NULL
  )`,
];

async function migrate(db: SQLiteDBConnection): Promise<void> {
  for (const stmt of SCHEMA) {
    await db.run(stmt);
  }
}

/**
 * 初始化数据库连接。
 * - Web 端：必须先 initWebStore() 才能把数据库落到 IndexedDB（真实持久化）；
 *   每次写操作后需调用 persist() -> saveToStore() 落盘。
 * - Native 端：直接走系统 SQLite。
 */
export async function initDatabase(): Promise<SQLiteDBConnection> {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    const mgr = getManager();
    if (!Capacitor.isNativePlatform()) {
      await mgr.initWebStore();
    }
    const isConn = (await mgr.isConnection(DB_NAME, false)).result;
    if (isConn) {
      dbConn = await mgr.retrieveConnection(DB_NAME, false);
    } else {
      dbConn = await mgr.createConnection(DB_NAME, false, 'no-encryption', 1, false);
    }
    await dbConn.open();
    await migrate(dbConn);
    return dbConn;
  })();
  return initPromise;
}

export async function getDb(): Promise<SQLiteDBConnection> {
  if (!dbConn) return initDatabase();
  return dbConn;
}

/** Web 端写操作后落盘到 IndexedDB；Native 端无需调用。 */
export async function persist(): Promise<void> {
  if (sqlite && !Capacitor.isNativePlatform()) {
    await sqlite.saveToStore(DB_NAME);
  }
}
