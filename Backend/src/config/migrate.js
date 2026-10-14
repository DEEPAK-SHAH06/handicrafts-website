const pool = require("./db");

async function migrate() {
  console.log("Running database migrations...");

  // Users table
  const createUsersTableQuery = `
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) DEFAULT NULL,
      google_id VARCHAR(255) DEFAULT NULL UNIQUE,
      avatar_url VARCHAR(512) DEFAULT NULL,
      role ENUM('USER', 'ADMIN') NOT NULL DEFAULT 'USER',
      status ENUM('ACTIVE', 'DISABLED') NOT NULL DEFAULT 'ACTIVE',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_users_email (email),
      INDEX idx_users_google_id (google_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  await pool.query(createUsersTableQuery);
  console.log("✓ 'users' table is ready.");
}

if (require.main === module) {
  migrate()
    .then(() => {
      console.log("Migration completed successfully.");
      process.exit(0);
    })
    .catch((err) => {
      console.error("Migration failed:", err);
      process.exit(1);
    });
}

module.exports = migrate;
