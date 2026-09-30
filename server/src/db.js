import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

export const pool = new Pool({
  host: process.env.DB_HOST || 'db',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'contador_admin',
  password: process.env.DB_PASSWORD || 'contador_secret_2026',
  database: process.env.DB_NAME || 'portaldocontador_fiscal',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 3000,
});

let isConnected = false;

pool.on('connect', () => {
  isConnected = true;
});

pool.on('error', (err) => {
  console.warn('⚠️ [PostgreSQL Pool Warning]', err.message);
  isConnected = false;
});

export async function checkDbConnection() {
  try {
    const client = await pool.connect();
    const res = await client.query('SELECT NOW()');
    client.release();
    isConnected = true;
    return { ok: true, timestamp: res.rows[0].now };
  } catch (error) {
    isConnected = false;
    return { ok: false, error: error.message };
  }
}

export function isDbConnected() {
  return isConnected;
}
