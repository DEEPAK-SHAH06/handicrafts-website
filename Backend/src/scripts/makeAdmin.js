const pool = require("../config/db");

async function promoteToAdmin(targetEmail) {
  try {
    const email = targetEmail || process.argv[2];

    if (!email) {
      console.log("Usage: node src/scripts/makeAdmin.js <email>");
      console.log("Or: npm run make:admin <email>");
      process.exit(1);
    }

    const trimmedEmail = email.trim().toLowerCase();
    const [users] = await pool.query(
      "SELECT id, name, email, role FROM users WHERE LOWER(email) = LOWER(?)",
      [trimmedEmail]
    );

    if (users.length === 0) {
      console.error(`Error: User with email "${trimmedEmail}" not found in database.`);
      process.exit(1);
    }

    const user = users[0];
    if (user.role === "ADMIN") {
      console.log(`User "${user.name}" (${user.email}) is already an ADMIN.`);
      process.exit(0);
    }

    await pool.query("UPDATE users SET role = 'ADMIN' WHERE id = ?", [user.id]);
    console.log(`✓ Success: User "${user.name}" (${user.email}) has been promoted to ADMIN!`);
    process.exit(0);
  } catch (error) {
    console.error("Failed to promote user:", error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  promoteToAdmin();
}

module.exports = promoteToAdmin;
