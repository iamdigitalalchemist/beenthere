import { Pool } from "pg";

let pool: Pool | undefined;

export function getDatabasePool() {
  const connectionString = process.env.POSTGRES_URL;

  if (!connectionString) {
    return undefined;
  }

  const isLocal = connectionString.includes("localhost") || connectionString.includes("127.0.0.1");

  pool ??= new Pool({
    connectionString,
    max: 1,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
    ssl: isLocal ? false : { rejectUnauthorized: false },
  });
  return pool;
}

export function hasDatabaseConnection() {
  return Boolean(process.env.POSTGRES_URL);
}
