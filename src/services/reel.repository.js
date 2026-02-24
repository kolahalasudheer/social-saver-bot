// Reel repository (database layer) – ESM
import pool from "../config/db.js";


// 0️⃣ Check if reel already exists for this user
export async function findReelByUserAndShortcode(userPhone, shortcode) {
  const query = `
    SELECT * FROM reels
    WHERE user_phone = $1 AND shortcode = $2
    LIMIT 1;
  `;

  const { rows } = await pool.query(query, [userPhone, shortcode]);
  return rows[0] || null;
}


// 1️⃣ Create initial record (status = processing)
export async function createReelRecord({ userPhone, originalUrl, shortcode }) {
  try {
    const query = `
      INSERT INTO reels (user_phone, url, shortcode, status)
      VALUES ($1, $2, $3, 'processing')
      RETURNING *;
    `;

    const values = [userPhone, originalUrl, shortcode];

    const { rows } = await pool.query(query, values);
    return rows[0];

  } catch (error) {
    // Unique constraint violation
    if (error.code === "23505") {
      const duplicateError = new Error(
        "This reel is already saved in your dashboard."
      );
      duplicateError.statusCode = 409;
      throw duplicateError;
    }

    throw error;
  }
}


// 2️⃣ Update with metadata (status = metadata_extracted)
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
      status = 'metadata_extracted'
    WHERE shortcode = $10
    RETURNING *;
  `;

  const values = [
    metadata.url,
    metadata.caption,
    JSON.stringify(metadata.hashtags || []),
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


// 3️⃣ Update with AI enrichment (status = completed)
export async function updateReelAI(shortcode, { summary, category, intent }) {
  const query = `
    UPDATE reels
    SET
      summary = $1,
      category = $2,
      intent = $3,
      status = 'completed'
    WHERE shortcode = $4
    RETURNING *;
  `;

  const values = [summary, category, intent, shortcode];

  const { rows } = await pool.query(query, values);
  return rows[0];
}


// 4️⃣ Mark reel as failed
export async function markReelFailed(shortcode) {
  await pool.query(
    `UPDATE reels SET status = 'failed' WHERE shortcode = $1`,
    [shortcode]
  );
}

// 4b️⃣ Reset reel to processing
export async function resetReelToProcessing(shortcode) {
  const query = `
    UPDATE reels
    SET status = 'processing'
    WHERE shortcode = $1
    RETURNING *;
  `;
  const { rows } = await pool.query(query, [shortcode]);
  return rows[0];
}

// 5️⃣ Fetch all reels for a specific user (dashboard)
export async function getAllReels(userPhone) {
  let query = `
    SELECT
      id, shortcode, user_phone, url, canonical_url,
      caption, hashtags, username, full_name,
      thumbnail_url, video_url, duration_seconds,
      posted_at, summary, category, intent, status,
      is_starred, created_at
    FROM reels
  `;

  const values = [];
  if (userPhone) {
    query += ` WHERE user_phone = $1 `;
    values.push(userPhone);
  }

  query += ` ORDER BY created_at DESC; `;

  const { rows } = await pool.query(query, values);
  return rows;
}

// 5b️⃣ Fetch recent reels for a specific user (WhatsApp bot context)
export async function getRecentReelsByUser(userPhone, limit = 3) {
  const query = `
    SELECT id, shortcode, category, summary, caption, canonical_url, url, created_at
    FROM reels
    WHERE user_phone = $1
    ORDER BY created_at DESC
    LIMIT $2;
  `;
  const { rows } = await pool.query(query, [userPhone, limit]);
  return rows;
}



// 6️⃣ Fetch reels that have Apify data but no AI enrichment yet
export async function getReelsNeedingAI() {
  const query = `
    SELECT shortcode, caption, hashtags
    FROM reels
    WHERE caption IS NOT NULL
      AND summary IS NULL
    ORDER BY id ASC;
  `;
  const { rows } = await pool.query(query);
  return rows;
}


// ─────── REMINDER FUNCTIONS ────────────────────────────

// 7️⃣ Create a reminder for a reel
export async function createReminder({ reelId, userPhone, remindAt, note }) {
  const query = `
    INSERT INTO reminders (reel_id, user_phone, remind_at, note, status)
    VALUES ($1, $2, $3, $4, 'pending')
    RETURNING *;
  `;
  const { rows } = await pool.query(query, [reelId, userPhone, remindAt, note || null]);
  return rows[0];
}

// 8️⃣ Fetch all due reminders (with reel data joined)
export async function getDueReminders() {
  const query = `
    SELECT
      rem.id         AS reminder_id,
      rem.user_phone,
      rem.note,
      r.shortcode,
      r.canonical_url,
      r.url,
      r.summary,
      r.category,
      r.username,
      r.thumbnail_url
    FROM reminders rem
    JOIN reels r ON r.id = rem.reel_id
    WHERE rem.remind_at <= NOW()
      AND rem.status = 'pending'
    ORDER BY rem.remind_at ASC;
  `;
  const { rows } = await pool.query(query);
  return rows;
}

// 9️⃣ Mark a reminder as sent (or failed)
export async function markReminderSent(reminderId, status = 'sent') {
  await pool.query(
    `UPDATE reminders SET status = $1 WHERE id = $2`,
    [status, reminderId]
  );
}

// 🔟 Toggle star status
export async function toggleStar(id) {
  const query = `
    UPDATE reels
    SET is_starred = NOT COALESCE(is_starred, FALSE)
    WHERE id = $1
    RETURNING id, is_starred;
  `;
  const { rows } = await pool.query(query, [id]);
  return rows[0];
}
// 11️⃣ Delete a reel
export async function deleteReel(id) {
  const query = `
    DELETE FROM reels
    WHERE id = $1
    RETURNING *;
  `;
  const { rows } = await pool.query(query, [id]);
  return rows[0];
}
