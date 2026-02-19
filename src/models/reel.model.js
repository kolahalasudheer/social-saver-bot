// Reel database model (ESM)
import pool from '../config/db.js';

export const findAll = async () => {
  try {
    const result = await pool.query('SELECT * FROM reels');
    return result.rows;
  } catch (error) {
    throw new Error(`Database query failed: ${error.message}`);
  }
};

export const findById = async (id) => {
  try {
    const result = await pool.query('SELECT * FROM reels WHERE id = $1', [id]);
    return result.rows[0] || null;
  } catch (error) {
    throw new Error(`Database query failed: ${error.message}`);
  }
};

export const createReel = async (userPhone, url) => {
  try {
    const query = `
      INSERT INTO reels (user_phone, url)
      VALUES ($1, $2)
      RETURNING *;
    `;

    const result = await pool.query(query, [userPhone, url]);
    return result.rows[0];

  } catch (error) {

    // PostgreSQL unique violation error code
    if (error.code === "23505") {
      const duplicateError = new Error("This Reel is already been saved in your dashboard.");
      duplicateError.statusCode = 409; // Conflict
      throw duplicateError;
    }

    throw error;
  }
};

export const update = async (id, data) => {
  try {
    const result = await pool.query(
      'UPDATE reels SET title = $1, description = $2 WHERE id = $3 RETURNING *',
      [data.title, data.description, id]
    );
    return result.rows[0] || null;
  } catch (error) {
    throw new Error(`Database update failed: ${error.message}`);
  }
};

export const deleteReel = async (id) => {
  try {
    const result = await pool.query('DELETE FROM reels WHERE id = $1', [id]);
    return result.rowCount > 0;
  } catch (error) {
    throw new Error(`Database delete failed: ${error.message}`);
  }
};
