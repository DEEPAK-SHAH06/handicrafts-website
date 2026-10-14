const pool = require("../config/db");

const UserModel = {
  /**
   * Find user by email (case-insensitive)
   */
  async findByEmail(email) {
    const [rows] = await pool.query(
      "SELECT * FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1",
      [email]
    );
    return rows[0] || null;
  },

  /**
   * Find user by ID
   */
  async findById(id) {
    const [rows] = await pool.query(
      "SELECT id, name, email, google_id, avatar_url, role, status, created_at, updated_at FROM users WHERE id = ? LIMIT 1",
      [id]
    );
    return rows[0] || null;
  },

  /**
   * Find user by Google ID
   */
  async findByGoogleId(googleId) {
    const [rows] = await pool.query(
      "SELECT * FROM users WHERE google_id = ? LIMIT 1",
      [googleId]
    );
    return rows[0] || null;
  },

  /**
   * Create a new user (role defaults to USER; backend ignores user-supplied role on signup)
   */
  async create({ name, email, passwordHash = null, googleId = null, avatarUrl = null, role = "USER" }) {
    const normalizedEmail = email.trim().toLowerCase();
    const [result] = await pool.query(
      `INSERT INTO users (name, email, password_hash, google_id, avatar_url, role, status)
       VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE')`,
      [name.trim(), normalizedEmail, passwordHash, googleId, avatarUrl, role]
    );

    return this.findById(result.insertId);
  },

  /**
   * Link Google account to existing user by ID
   */
  async linkGoogleAccount(id, googleId, avatarUrl = null) {
    if (avatarUrl) {
      await pool.query(
        `UPDATE users
         SET google_id = ?, avatar_url = COALESCE(avatar_url, ?)
         WHERE id = ?`,
        [googleId, avatarUrl, id]
      );
    } else {
      await pool.query(
        "UPDATE users SET google_id = ? WHERE id = ?",
        [googleId, id]
      );
    }

    return this.findById(id);
  },

  /**
   * Update basic profile info (e.g. name, avatar)
   */
  async updateProfile(id, { name, avatarUrl }) {
    const updates = [];
    const values = [];

    if (name !== undefined && name !== null) {
      updates.push("name = ?");
      values.push(name.trim());
    }

    if (avatarUrl !== undefined && avatarUrl !== null) {
      updates.push("avatar_url = ?");
      values.push(avatarUrl.trim());
    }

    if (updates.length === 0) return this.findById(id);

    values.push(id);
    await pool.query(
      `UPDATE users SET ${updates.join(", ")} WHERE id = ?`,
      values
    );

    return this.findById(id);
  },

  /**
   * Admin: fetch all users
   */
  async findAll() {
    const [rows] = await pool.query(
      `SELECT id, name, email, google_id, avatar_url, role, status, created_at, updated_at
       FROM users
       ORDER BY created_at DESC`
    );
    return rows;
  },

  /**
   * Admin: update user status (ACTIVE / DISABLED)
   */
  async updateStatus(id, status) {
    await pool.query(
      "UPDATE users SET status = ? WHERE id = ?",
      [status, id]
    );
    return this.findById(id);
  },

  /**
   * Admin: update user role (USER / ADMIN)
   */
  async updateRole(id, role) {
    await pool.query(
      "UPDATE users SET role = ? WHERE id = ?",
      [role, id]
    );
    return this.findById(id);
  },

  /**
   * Count users by role and status for admin stats
   */
  async getStats() {
    const [totalRows] = await pool.query("SELECT COUNT(*) AS total FROM users");
    const [activeRows] = await pool.query("SELECT COUNT(*) AS active FROM users WHERE status = 'ACTIVE'");
    const [adminRows] = await pool.query("SELECT COUNT(*) AS admins FROM users WHERE role = 'ADMIN'");
    const [googleRows] = await pool.query("SELECT COUNT(*) AS googleUsers FROM users WHERE google_id IS NOT NULL");

    return {
      totalUsers: totalRows[0].total,
      activeUsers: activeRows[0].active,
      admins: adminRows[0].admins,
      googleLinkedUsers: googleRows[0].googleUsers,
    };
  }
};

module.exports = UserModel;
