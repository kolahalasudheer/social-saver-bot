import pool from "../config/db.js";

// 0️⃣ Check if reel exists for user
export async function findReelByUserAndShortcode(userPhone, shortcode) {
  const query = `
    SELECT * FROM reels
    WHERE user_phone = $1 AND shortcode = $2
    LIMIT 1;
  `;

  const { rows } = await pool.query(query, [userPhone, shortcode]);
  return rows[0] || null;
}

// 1️⃣ Create initial record
export async function createReelRecord({ userPhone, originalUrl, shortcode }) {
  const query = `
    INSERT INTO reels (user_phone, url, shortcode, status)
    VALUES ($1, $2, $3, 'processing')
    RETURNING *;
  `;

  const values = [userPhone, originalUrl, shortcode];

  const { rows } = await pool.query(query, values);
  return rows[0];
}

// 2️⃣ Update with metadata
export async function updateReelMetadata(shortcode, metadata) {
  const query = `
    UPDATE reels
    SET
      canonical_url = $1,
      caption = $2,
      hashtags = $3,
      username = $4,
      full_name = $5,
      thumbnail_url = $6,
      video_url = $7,
      duration_seconds = $8,
      posted_at = $9,
      status = 'completed'
    WHERE shortcode = $10
    RETURNING *;
  `;

  const values = [
    metadata.url,
    metadata.caption,
    JSON.stringify(metadata.hashtags),
    metadata.username,
    metadata.full_name,
    metadata.thumbnail_url,
    metadata.video_url,
    metadata.duration_seconds,
    metadata.timestamp,
    shortcode,
  ];

  const { rows } = await pool.query(query, values);
  return rows[0];
}

// 3️⃣ Mark failure
export async function markReelFailed(shortcode) {
  await pool.query(
    `UPDATE reels SET status = 'failed' WHERE shortcode = $1`,
    [shortcode]
  );
}
