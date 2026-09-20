import { Pool, QueryResult, QueryResultRow } from 'pg';

/**
 * Robust PostgreSQL connection pool for Aiven Cloud.
 * Handles self-signed certificate chains and connection pooling in serverless environments.
 */
let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    const rawUrl =
      process.env.DATABASE_URL ||
      'postgresql://avnadmin:REDACTED_AIVEN_PASSWORD@pg-2d756d14-dmcbaditya-9ffc.e.aivencloud.com:25798/defaultdb';

    // Strip ?sslmode=... so pg-connection-string doesn't override rejectUnauthorized
    const cleanUrl = rawUrl.split('?')[0];
    const isCloud = cleanUrl.includes('aivencloud') || rawUrl.includes('ssl');

    pool = new Pool({
      connectionString: cleanUrl,
      ssl: isCloud ? { rejectUnauthorized: false } : undefined,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    pool.on('error', (err) => {
      console.error('Unexpected error on idle PostgreSQL client:', err);
    });
  }

  return pool;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<T>> {
  const p = getPool();
  const start = Date.now();
  const res = await p.query<T>(text, params);
  const duration = Date.now() - start;
  if (process.env.NODE_ENV === 'development') {
    console.log('[PG_QUERY]', { text, duration, rows: res.rowCount });
  }
  return res;
}
