const dotenv = require("dotenv");
const path = require("path");
const { Pool } = require("pg");
const { loadMigrationFiles } = require("postgres-migrations");

dotenv.config();

async function main() {
  if (process.env.NODE_ENV === "production") {
    console.log("Skipping migration hash repair in production.");
    return;
  }

  const pool = new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl:
      process.env.DB_SSL === "false"
        ? false
        : { rejectUnauthorized: false },
  });

  const client = await pool.connect();

  try {
    const migrationsPath = path.join(process.cwd(), "src", "db", "migrations");
    const migrations = (await loadMigrationFiles(migrationsPath)).filter(
      (migration) => migration.id > 0,
    );

    await client.query("BEGIN");

    let updated = 0;
    for (const migration of migrations) {
      const result = await client.query(
        "UPDATE public.migrations SET hash = $1 WHERE id = $2 AND name = $3",
        [migration.hash, migration.id, migration.name],
      );
      updated += result.rowCount || 0;
    }

    await client.query("COMMIT");
    console.log(`Migration hash repair complete (${updated} row(s) updated).`);
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // Ignore rollback failures so the original error is visible.
    }
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error("Migration hash repair failed:", error);
  process.exit(1);
});
