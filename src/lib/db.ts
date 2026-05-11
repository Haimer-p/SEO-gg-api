import { Pool, PoolClient } from 'pg';

const pool = new Pool({
  connectionString: process.env['DATABASE_URL'],
  // Fallback for local dev without DATABASE_URL
  ...(process.env['DATABASE_URL']
    ? {}
    : {
        host: process.env['DB_HOST'] || 'localhost',
        port: Number(process.env['DB_PORT']) || 5432,
        database: process.env['DB_NAME'] || 'seodb',
        user: process.env['DB_USER'] || 'seouser',
        password: process.env['DB_PASSWORD'] || 'seopassword',
      }),
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
});

export async function query<T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result.rows as T[];
  } finally {
    client.release();
  }
}

export async function withTransaction<T>(
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function testConnection(): Promise<boolean> {
  try {
    const rows = await query<{ now: string }>('SELECT NOW() as now');
    console.log(`✅ PostgreSQL connected at ${rows[0]?.now}`);
    return true;
  } catch (err) {
    console.warn('⚠️  PostgreSQL not available, using mock data:', (err as Error).message);
    return false;
  }
}

export default pool;
