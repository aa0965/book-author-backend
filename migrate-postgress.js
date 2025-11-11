import pg from "pg";
const { Client } = pg;

// Local database (source)
const localDB = new Client({
  host: "localhost",
  port: 5432,
  user: "postgres",
  password: "password123", // 🔧 replace with your local password
  database: "booksdb",
});

// Railway database (destination)
const remoteDB = new Client({
  host: "hopper.proxy.rlwy.net",
  port: 50772,
  user: "postgres",
  password: "OeyzlfBQeYxJaScaObNUdLCvlUnHDeJu",
  database: "railway",
  ssl: { rejectUnauthorized: false }, // Railway requires SSL
});

async function migrate() {
  try {
    console.log("🔌 Connecting to both databases...");
    await localDB.connect();
    await remoteDB.connect();
    console.log("✅ Connected successfully!");

    // Get all table names
    const { rows: tables } = await localDB.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema='public' AND table_type='BASE TABLE';
    `);

    for (const { table_name } of tables) {
      console.log(`🚚 Migrating table: ${table_name}`);

      // Create table schema on remote
      const { rows: schemaRows } = await localDB.query(
        `SELECT 'CREATE TABLE ' || quote_ident($1) || ' (' ||
        string_agg(column_name || ' ' || data_type || 
        COALESCE('(' || character_maximum_length || ')',''), ', ') || ');' as ddl
        FROM information_schema.columns
        WHERE table_name=$1
        GROUP BY table_name;`,
        [table_name]
      );

      const ddl = schemaRows[0]?.ddl;
      if (ddl) {
        try {
          await remoteDB.query(`DROP TABLE IF EXISTS "${table_name}" CASCADE;`);
          await remoteDB.query(ddl);
          console.log(`✅ Table ${table_name} schema migrated`);
        } catch (err) {
          console.warn(`⚠️ Schema creation failed for ${table_name}: ${err.message}`);
        }
      }

      // Fetch all rows from local
      const { rows: data } = await localDB.query(`SELECT * FROM "${table_name}";`);

      // Insert rows into remote
      for (const row of data) {
        const cols = Object.keys(row)
          .map((c) => `"${c}"`)
          .join(",");
        const vals = Object.values(row);
        const placeholders = vals.map((_, i) => `$${i + 1}`).join(",");

        try {
          await remoteDB.query(
            `INSERT INTO "${table_name}" (${cols}) VALUES (${placeholders})`,
            vals
          );
        } catch (err) {
          console.warn(`⚠️ Skipping row in ${table_name}: ${err.message}`);
        }
      }

      console.log(`✅ Table ${table_name} data migrated (${data.length} rows)`);
    }

    console.log("🎉 Migration completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
  } finally {
    await localDB.end();
    await remoteDB.end();
  }
}

migrate();
