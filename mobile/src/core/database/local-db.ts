export interface LocalDatabase {
  getAllSync<T = Record<string, unknown>>(sql: string, params?: unknown[]): T[];
  getFirstSync<T = Record<string, unknown>>(sql: string, params?: unknown[]): T | null;
  runSync(sql: string, params?: unknown[]): { changes: number; lastInsertRowId: number };
}

let dbInstance: LocalDatabase | null = null;

export function getLocalDatabase(): LocalDatabase {
  if (dbInstance) {
    return dbInstance;
  }

  // 1. In React Native runtime
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const SQLite = require('expo-sqlite');
    if (SQLite && typeof SQLite.openDatabaseSync === 'function') {
      const dbName = 'schemes.db';
      const expoDb = SQLite.openDatabaseSync(dbName);

      dbInstance = {
        getAllSync<T = Record<string, unknown>>(sql: string, params: unknown[] = []): T[] {
          return expoDb.getAllSync(sql, params) as T[];
        },
        getFirstSync<T = Record<string, unknown>>(sql: string, params: unknown[] = []): T | null {
          return (expoDb.getFirstSync(sql, params) as T) || null;
        },
        runSync(sql: string, params: unknown[] = []) {
          const res = expoDb.runSync(sql, params);
          return { changes: res.changes, lastInsertRowId: res.lastInsertRowId };
        },
      };
      return dbInstance;
    }
  } catch {
    // Fallthrough to Node/Jest/tsx testing environment
  }

  // 2. In Node / tsx testing environment
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const nodeSqlite = require('node:sqlite');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require('path');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require('fs');

    const candidates = [
      path.resolve(__dirname, '../../../assets/db/schemes.db'),
      path.resolve(process.cwd(), 'assets/db/schemes.db'),
      path.resolve(process.cwd(), 'mobile/assets/db/schemes.db'),
    ];

    const dbPath = candidates.find((p) => fs.existsSync(p));
    if (!dbPath) {
      throw new Error(`schemes.db not found in candidates: ${candidates.join(', ')}`);
    }

    const db = new nodeSqlite.DatabaseSync(dbPath);

    dbInstance = {
      getAllSync<T = Record<string, unknown>>(sql: string, params: unknown[] = []): T[] {
        const stmt = db.prepare(sql);
        return stmt.all(...params) as T[];
      },
      getFirstSync<T = Record<string, unknown>>(sql: string, params: unknown[] = []): T | null {
        const stmt = db.prepare(sql);
        const result = stmt.get(...params);
        return (result as T) || null;
      },
      runSync(sql: string, params: unknown[] = []) {
        const stmt = db.prepare(sql);
        const res = stmt.run(...params);
        return { changes: res.changes, lastInsertRowId: Number(res.lastInsertRowid) };
      },
    };
    return dbInstance;
  } catch (err) {
    console.error('Failed to initialize local SQLite database:', err);
    throw err;
  }
}

export const LOCAL_DB_VERSION = 2;
const STORAGE_KEY_DB_VERSION = 'app_local_sqlite_db_version';

export async function initializeLocalDatabase(): Promise<void> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { mmkvStorage } = require('../storage/mmkv');
    const installedVersion = Number(mmkvStorage.getString(STORAGE_KEY_DB_VERSION) || '0');
    const needsUpgrade = installedVersion < LOCAL_DB_VERSION;

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    let FileSystem: any = null;
    try {
      FileSystem = require('expo-file-system/legacy');
    } catch {
      try {
        FileSystem = require('expo-file-system');
      } catch {}
    }

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Asset } = require('expo-asset');
    if (!FileSystem || !Asset) return;

    if (FileSystem.Paths && FileSystem.Directory && FileSystem.File) {
      const sqliteDir = new FileSystem.Directory(FileSystem.Paths.document, 'SQLite');
      if (!sqliteDir.exists) {
        sqliteDir.create();
      }
      const targetDb = new FileSystem.File(sqliteDir, 'schemes.db');
      if (!targetDb.exists || needsUpgrade) {
        const asset = Asset.fromModule(require('../../../assets/db/schemes.db'));
        await asset.downloadAsync();
        const srcPath = asset.localUri || asset.uri;
        const srcFile = new FileSystem.File(srcPath);
        if (targetDb.exists) {
          targetDb.delete();
        }
        srcFile.copy(targetDb);
        mmkvStorage.set(STORAGE_KEY_DB_VERSION, String(LOCAL_DB_VERSION));
      }
    } else if (FileSystem.copyAsync && FileSystem.getInfoAsync) {
      const dbDir = `${FileSystem.documentDirectory}SQLite`;
      const dbPath = `${dbDir}/schemes.db`;

      const dirInfo = await FileSystem.getInfoAsync(dbDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(dbDir, { intermediates: true });
      }

      const fileInfo = await FileSystem.getInfoAsync(dbPath);
      if (!fileInfo.exists || needsUpgrade) {
        const asset = Asset.fromModule(require('../../../assets/db/schemes.db'));
        await asset.downloadAsync();
        if (fileInfo.exists && FileSystem.deleteAsync) {
          try {
            await FileSystem.deleteAsync(dbPath, { idempotent: true });
          } catch {}
        }
        await FileSystem.copyAsync({ from: asset.localUri || asset.uri, to: dbPath });
        mmkvStorage.set(STORAGE_KEY_DB_VERSION, String(LOCAL_DB_VERSION));
      }
    }
  } catch (e) {
    console.warn('Database asset unpacking notice:', e);
  }
}
