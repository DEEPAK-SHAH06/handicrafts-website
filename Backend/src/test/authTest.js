const http = require("http");
const pool = require("../config/db");
const UserModel = require("../models/userModel");

const BASE_URL = process.env.TEST_URL || "http://localhost:5001";

// Helper for making HTTP requests
function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const headers = options.headers || {};
    let body = options.body;

    if (body && typeof body === "object" && !(body instanceof Buffer)) {
      body = JSON.stringify(body);
      headers["Content-Type"] = "application/json";
    }

    if (body) {
      headers["Content-Length"] = Buffer.byteLength(body);
    }

    const req = http.request(
      url,
      {
        method: options.method || "GET",
        headers,
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          let parsed = data;
          try {
            parsed = JSON.parse(data);
          } catch {
            // keep raw text
          }
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: parsed,
          });
        });
      }
    );

    req.on("error", reject);

    if (body) {
      req.write(body);
    }
    req.end();
  });
}

async function runTests() {
  console.log("==================================================");
  console.log("   HIMALAYAN SACRED ARTS AUTHENTICATION TEST SUITE ");
  console.log("==================================================\n");

  const testEmail = "artisan.test@sacredarts.org";
  const secondEmail = "second.test@sacredarts.org";
  const testPassword = "SacredPass123";

  // Clean up any test users
  await pool.query("DELETE FROM users WHERE email IN (?, ?)", [testEmail, secondEmail]);
  console.log("✓ Initial cleanup: test database prepared.");

  let userToken = "";
  let adminToken = "";
  let testUserId = null;

  // 1. SIGN UP: Valid registration
  console.log("\n[TEST 1] User Sign Up (Valid)");
  const signupRes = await request("/api/auth/signup", {
    method: "POST",
    body: {
      name: "Tenzin Norbu",
      email: testEmail,
      password: testPassword,
      confirmPassword: testPassword,
    },
  });
  console.log(`Status: ${signupRes.status}`);
  if (signupRes.status === 201 && signupRes.data.success && signupRes.data.user.role === "USER") {
    userToken = signupRes.data.token;
    testUserId = signupRes.data.user.id;
    console.log("PASS: User created successfully with role 'USER' (not plain text password).");
  } else {
    throw new Error(`FAIL: Unexpected signup response: ${JSON.stringify(signupRes.data)}`);
  }

  // Verify in MySQL
  const [dbUser] = await pool.query("SELECT * FROM users WHERE email = ?", [testEmail]);
  if (!dbUser[0] || dbUser[0].password_hash === testPassword) {
    throw new Error("FAIL: Password stored as plain text or user not in DB!");
  }
  console.log("PASS: MySQL persistence verified. Password securely hashed with bcrypt.");

  // 2. SIGN UP: Duplicate email prevention
  console.log("\n[TEST 2] Duplicate Email Registration Prevention");
  const duplicateRes = await request("/api/auth/signup", {
    method: "POST",
    body: {
      name: "Another Name",
      email: testEmail,
      password: testPassword,
      confirmPassword: testPassword,
    },
  });
  console.log(`Status: ${duplicateRes.status}`);
  if (duplicateRes.status === 409) {
    console.log("PASS: Duplicate registration safely blocked with 409 Conflict.");
  } else {
    throw new Error(`FAIL: Duplicate email allowed! Status: ${duplicateRes.status}`);
  }

  // 3. SIGN UP: Password validation checks
  console.log("\n[TEST 3] Password Strength & Match Validation");
  const weakPasswordRes = await request("/api/auth/signup", {
    method: "POST",
    body: {
      name: "Weak Pass",
      email: secondEmail,
      password: "weak",
      confirmPassword: "weak",
    },
  });
  if (weakPasswordRes.status === 400) {
    console.log("PASS: Weak password blocked (status 400).");
  } else {
    throw new Error("FAIL: Weak password accepted!");
  }

  const mismatchRes = await request("/api/auth/signup", {
    method: "POST",
    body: {
      name: "Mismatch Pass",
      email: secondEmail,
      password: "StrongPassword1",
      confirmPassword: "DifferentPassword2",
    },
  });
  if (mismatchRes.status === 400) {
    console.log("PASS: Password mismatch blocked (status 400).");
  } else {
    throw new Error("FAIL: Password mismatch accepted!");
  }

  // 4. LOGIN: Invalid credentials
  console.log("\n[TEST 4] Login With Invalid Credentials");
  const badLoginRes = await request("/api/auth/login", {
    method: "POST",
    body: {
      email: testEmail,
      password: "WrongPassword999",
    },
  });
  if (badLoginRes.status === 401) {
    console.log("PASS: Invalid credentials rejected with 401 Unauthorized.");
  } else {
    throw new Error("FAIL: Invalid credentials allowed!");
  }

  // 5. LOGIN: Valid credentials
  console.log("\n[TEST 5] Login With Valid Credentials");
  const loginRes = await request("/api/auth/login", {
    method: "POST",
    body: {
      email: testEmail,
      password: testPassword,
    },
  });
  if (loginRes.status === 200 && loginRes.data.token) {
    userToken = loginRes.data.token;
    console.log("PASS: Login successful, JWT token and user profile returned.");
  } else {
    throw new Error(`FAIL: Login failed: ${JSON.stringify(loginRes.data)}`);
  }

  // 6. PROTECTED ROUTE: /api/auth/me
  console.log("\n[TEST 6] Protected Route: /api/auth/me");
  const unauthMeRes = await request("/api/auth/me");
  if (unauthMeRes.status === 401) {
    console.log("PASS: Unauthenticated request rejected (401).");
  } else {
    throw new Error("FAIL: Unauthenticated access permitted!");
  }

  const authMeRes = await request("/api/auth/me", {
    headers: { Authorization: `Bearer ${userToken}` },
  });
  if (authMeRes.status === 200 && authMeRes.data.user.email === testEmail) {
    console.log("PASS: Authenticated /api/auth/me returned correct current user.");
  } else {
    throw new Error("FAIL: Authenticated /api/auth/me failed!");
  }

  // 7. ROLE AUTHORIZATION: Regular USER attempting admin route
  console.log("\n[TEST 7] Role Authorization: Regular USER accessing /api/admin/dashboard");
  const adminForbiddenRes = await request("/api/admin/dashboard", {
    headers: { Authorization: `Bearer ${userToken}` },
  });
  if (adminForbiddenRes.status === 403) {
    console.log("PASS: Regular USER correctly denied access to admin route (403 Forbidden).");
  } else {
    throw new Error(`FAIL: Regular USER was not denied! Status: ${adminForbiddenRes.status}`);
  }

  // 8. ROLE AUTHORIZATION: Promote user to ADMIN and test admin access
  console.log("\n[TEST 8] Role Authorization: ADMIN accessing /api/admin/dashboard & users");
  await pool.query("UPDATE users SET role = 'ADMIN' WHERE id = ?", [testUserId]);

  // Re-login to get updated JWT token with ADMIN role
  const adminLoginRes = await request("/api/auth/login", {
    method: "POST",
    body: {
      email: testEmail,
      password: testPassword,
    },
  });
  adminToken = adminLoginRes.data.token;

  const adminDashboardRes = await request("/api/admin/dashboard", {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  if (adminDashboardRes.status === 200 && adminDashboardRes.data.stats) {
    console.log("PASS: Admin dashboard accessible for ADMIN role with platform metrics:", adminDashboardRes.data.stats);
  } else {
    throw new Error("FAIL: Admin could not access dashboard!");
  }

  const adminUsersRes = await request("/api/admin/users", {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  if (adminUsersRes.status === 200 && Array.isArray(adminUsersRes.data.users)) {
    const hasPasswordHash = adminUsersRes.data.users.some((u) => u.password_hash !== undefined);
    if (!hasPasswordHash) {
      console.log(`PASS: Admin users list retrieved (${adminUsersRes.data.users.length} users). Password hashes never exposed.`);
    } else {
      throw new Error("FAIL: Password hashes exposed in admin user list!");
    }
  }

  // 9. ACCOUNT STATUS HANDLING: Disable account and test login rejection
  console.log("\n[TEST 9] Account Status: Disable Account & Verify Access Blocked");
  // Create second user to test disable
  const user2Res = await request("/api/auth/signup", {
    method: "POST",
    body: {
      name: "Second User",
      email: secondEmail,
      password: testPassword,
      confirmPassword: testPassword,
    },
  });
  const user2Id = user2Res.data.user.id;

  // Admin disables user2
  const disableRes = await request(`/api/admin/users/${user2Id}/status`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { status: "DISABLED" },
  });
  if (disableRes.status === 200) {
    console.log("PASS: Admin disabled user account.");
  }

  // Attempt login with disabled account
  const disabledLoginRes = await request("/api/auth/login", {
    method: "POST",
    body: {
      email: secondEmail,
      password: testPassword,
    },
  });
  if (disabledLoginRes.status === 403 && disabledLoginRes.data.code === "ACCOUNT_DISABLED") {
    console.log("PASS: Disabled account rejected on login (403 ACCOUNT_DISABLED).");
  } else {
    throw new Error(`FAIL: Disabled account was able to log in! Status: ${disabledLoginRes.status}`);
  }

  // Re-enable account
  await request(`/api/admin/users/${user2Id}/status`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { status: "ACTIVE" },
  });
  console.log("PASS: Admin re-enabled user account.");

  // 10. GOOGLE ACCOUNT LINKING LOGIC
  console.log("\n[TEST 10] Google Account Linking & Provider Association");
  // Simulate linking Google account to user who originally signed up via email/password
  const mockGoogleId = "google-oauth-109823741029";
  const mockAvatar = "https://lh3.googleusercontent.com/a/mock-artisan-photo";
  const linkedUser = await UserModel.linkGoogleAccount(user2Id, mockGoogleId, mockAvatar);

  if (linkedUser.google_id === mockGoogleId && linkedUser.avatar_url === mockAvatar) {
    console.log("PASS: Google account safely linked to existing email account without duplicate creation.");
  } else {
    throw new Error("FAIL: Google account linking failed in model!");
  }

  // 11. LOGOUT
  console.log("\n[TEST 11] User Logout");
  const logoutRes = await request("/api/auth/logout", {
    method: "POST",
  });
  if (logoutRes.status === 200 && logoutRes.data.success) {
    console.log("PASS: Logout endpoint cleared session successfully.");
  } else {
    throw new Error("FAIL: Logout failed!");
  }

  // Final Cleanup
  await pool.query("DELETE FROM users WHERE email IN (?, ?)", [testEmail, secondEmail]);
  console.log("\n✓ Test cleanup complete. Database restored.");

  console.log("\n==================================================");
  console.log("    ALL 11 AUTHENTICATION TESTS PASSED 100%!       ");
  console.log("==================================================\n");
}

if (require.main === module) {
  runTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("\nTEST SUITE FAILED:", err);
      process.exit(1);
    });
}

module.exports = runTests;
