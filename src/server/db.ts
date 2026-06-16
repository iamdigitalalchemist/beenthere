import { Pool } from "pg";

let pool: Pool | undefined;

export function getDatabasePool() {
  const connectionString = process.env.POSTGRES_URL;

  if (!connectionString) {
    return undefined;
  }

  const isLocal = connectionString.includes("localhost") || connectionString.includes("127.0.0.1");

  // Serverless: keep max low to stay within PgBouncer/Supabase pooler limits while
  // still allowing concurrent requests within the same warm function instance.
  // Raise PG_POOL_MAX in env for dedicated Postgres or PgBouncer setups.
  const maxConnections = parseInt(process.env.PG_POOL_MAX ?? "5", 10);

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
