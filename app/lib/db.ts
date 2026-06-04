import { Pool } from 'pg';

// Pool global reutilizado entre hot-reloads del dev server.
const globalForPg = globalThis as unknown as { pgPool?: Pool };

export const pool =
  globalForPg.pgPool ??
  new Pool({
    connectionString:
      process.env.DATABASE_URL ??
      'postgres://challenge:challenge@localhost:5544/retail',
  });

if (!globalForPg.pgPool) globalForPg.pgPool = pool;

export async function query<T = any>(text: string, params: any[] = []): Promise<T[]> {
  const res = await pool.query(text, params);
  return res.rows as T[];
}
