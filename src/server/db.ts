import { Pool } from "pg";

let pool: Pool | undefined;

export function getDatabasePool() {
  const connectionString = process.env.POSTGRES_URL;

  if (!connectionString) {
    return undefined;
  }

  pool ??= new Pool({ connectionString });
  return pool;
}

export function hasDatabaseConnection() {
  return Boolean(process.env.POSTGRES_URL);
}
