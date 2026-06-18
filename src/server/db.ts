import { Pool } from "pg";

let pool: Pool | undefined;

export function getDatabasePool() {
  const connectionString = process.env.POSTGRES_URL;

  if (!connectionString) {
    return undefined;
  }

  const isLocal = connectionString.includes("localhost") || connectionString.includes("127.0.0.1");

  // Supabase transaction-mode pooler (port 6543) enforces a per-session connection
  // cap — EMAXCONNSESSION fires when max is too high on serverless. Keep it at 1
  // per function instance; Fluid Compute handles concurrency at the platform level.
  // Override with PG_POOL_MAX for dedicated Postgres or session-mode setups.
  const maxConnections = parseInt(process.env.PG_POOL_MAX ?? "1", 10);

  pool ??= new Pool({
    connectionString,
    max: maxConnections,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
    ssl: isLocal ? false : { rejectUnauthorized: false },
  });
  return pool;
}

export function hasDatabaseConnection() {
  return Boolean(process.env.POSTGRES_URL);
}
