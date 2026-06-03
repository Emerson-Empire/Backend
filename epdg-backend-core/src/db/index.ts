import { Pool } from "pg";
import { migrate } from "postgres-migrations";
import path from "path";

let pool: Pool | null = null;
const MIGRATION_LOCK_ID = 92135742;

function getSslConfig() {
  if (process.env.DB_SSL === "true") {
    return { rejectUnauthorized: false };
  }

  if (process.env.DB_SSL === "false") {
    return false;
  }

  if (
    process.env.NODE_ENV === "production" ||
    process.env.DB_HOST?.includes("supabase.com")
  ) {
    return { rejectUnauthorized: false };
  }

  return false;
}

function getPool(): Pool {
  if (!pool) {
    const required = ["DB_HOST", "DB_NAME", "DB_USER", "DB_PASSWORD"];
    const missing = required.filter((key) => !process.env[key]);
    if (missing.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missing.join(", ")}`,
      );
    }

    const dbConfig = {
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ssl: getSslConfig(),
    };

    pool = new Pool(dbConfig);
  }
  return pool;
}

export async function testConnection(): Promise<void> {
  const client = await getPool().connect();
  try {
    await client.query("SELECT 1");
  } finally {
    client.release();
  }
}

export async function performMigration() {
  const client = await getPool().connect();
  const migrationsPath = path.join(__dirname, "migrations");
  let lockAcquired = false;

  try {
    await client.query("SELECT pg_advisory_lock($1)", [MIGRATION_LOCK_ID]);
    lockAcquired = true;
    console.info("Starting database migration...");
    await migrate({ client }, migrationsPath);
    console.info("Database migration completed successfully.");
  } catch (e: any) {
    console.error("Error occurred while migrating:", e);
    throw e;
  } finally {
    if (lockAcquired) {
      await client.query("SELECT pg_advisory_unlock($1)", [MIGRATION_LOCK_ID]);
    }
    client.release();
  }
}
