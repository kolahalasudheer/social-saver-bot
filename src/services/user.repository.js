import pool from '../config/db.js';

/**
 * 👤 User & Auth Repository
 * Manages user registration and verification codes.
 */

// ─── USER MANAGEMENT ────────────────────────────────

export async function findUserByPhone(phone) {
    const query = 'SELECT * FROM users WHERE phone = $1 LIMIT 1;';
    const { rows } = await pool.query(query, [phone]);
    return rows[0] || null;
}

export async function createUser(phone, isRegistered = false) {
    const query = `
    INSERT INTO users (phone, is_registered)
    VALUES ($1, $2)
    ON CONFLICT (phone) DO UPDATE 
    SET is_registered = EXCLUDED.is_registered
    RETURNING *;
  `;
    const { rows } = await pool.query(query, [phone, isRegistered]);
    return rows[0];
}

export async function markUserRegistered(phone) {
    const query = 'UPDATE users SET is_registered = TRUE WHERE phone = $1 RETURNING *;';
    const { rows } = await pool.query(query, [phone]);
    return rows[0];
}

// ─── AUTH CODE MANAGEMENT ───────────────────────────

export async function saveAuthCode(phone, code, expiryMinutes = 5) {
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + expiryMinutes);

    const query = `
    INSERT INTO auth_codes (phone, code, expires_at)
    VALUES ($1, $2, $3)
    ON CONFLICT (phone) DO UPDATE
    SET code = EXCLUDED.code, expires_at = EXCLUDED.expires_at, created_at = NOW()
    RETURNING *;
  `;
    const { rows } = await pool.query(query, [phone, code, expiresAt]);
    return rows[0];
}

export async function verifyAuthCode(phone, code) {
    const query = `
    SELECT * FROM auth_codes 
    WHERE phone = $1 AND code = $2 AND expires_at > NOW()
    LIMIT 1;
  `;
    const { rows } = await pool.query(query, [phone, code]);
    return rows[0] || null;
}

export async function deleteAuthCode(phone) {
    await pool.query('DELETE FROM auth_codes WHERE phone = $1', [phone]);
}
