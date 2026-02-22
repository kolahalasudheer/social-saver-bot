import pool from '../src/config/db.js';

async function setup() {
    console.log('🚀 Starting Multi-User Database Setup...');

    const queries = [
        // 1. Create Users Table
        `CREATE TABLE IF NOT EXISTS users (
      phone VARCHAR(30) PRIMARY KEY,
      is_registered BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );`,

        // 2. Create Auth Codes Table
        `CREATE TABLE IF NOT EXISTS auth_codes (
      phone VARCHAR(30) PRIMARY KEY REFERENCES users(phone) ON DELETE CASCADE,
      code VARCHAR(6) NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );`,

        // 3. Ensure reels table has user_phone (it should, but just in case)
        `DO $$ 
     BEGIN 
       IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='reels' AND column_name='user_phone') THEN
         ALTER TABLE reels ADD COLUMN user_phone VARCHAR(30);
       END IF;
     END $$;`
    ];

    try {
        for (const query of queries) {
            await pool.query(query);
        }
        console.log('✅ Database tables created successfully!');

        // Seed existing numbers into users table to migrate current users
        console.log('📦 Migrating existing numbers from reels to users table...');
        await pool.query(`
      INSERT INTO users (phone, is_registered)
      SELECT DISTINCT user_phone, TRUE FROM reels
      WHERE user_phone IS NOT NULL
      ON CONFLICT (phone) DO NOTHING;
    `);
        console.log('✅ Migration complete!');

        process.exit(0);
    } catch (err) {
        console.error('❌ Database setup failed:', err.message);
        process.exit(1);
    }
}

setup();
