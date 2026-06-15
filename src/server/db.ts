import { Pool } from "pg";

let pool: Pool | undefined;

export function getDatabasePool() {
  const connectionString = process.env.POSTGRES_URL;

  if (!connectionString) {
    return undefined;
  }

  pool ??= new Pool({
    connectionString,
    max: 1,                      // serverless: one connection per function instance
    idleTimeoutMillis: 10_000,   // release idle connections quickly
    connectionTimeoutMillis: 10_000,
    ssl: { rejectUnauthorized: false },
  });
  return pool;
}

export function hasDatabaseConnection() {
  return Boolean(process.env.POSTGRES_URL);
}
