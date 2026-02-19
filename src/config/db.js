import dotenv from "dotenv";
dotenv.config();

import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

(async () => {
  try {
    await pool.query("SELECT NOW()");
    console.log("✅ Connected to Neon PostgreSQL");
  } catch (err) {
    console.error("❌ Neon connection failed:", err.message);
  }
})();

export default pool;
