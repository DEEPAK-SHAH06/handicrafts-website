const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const UserModel = require("../models/userModel");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * Cookie options helper
 */
function getCookieOptions() {
  const isProduction = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProduction, // HTTPS in production
    sameSite: isProduction ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: "/",
  };
}

/**
 * Generate JWT token
 */
function generateToken(user) {
  const secret = process.env.JWT_SECRET || "default_dev_secret_handicraft_2026";
  const expiresIn = process.env.JWT_EXPIRES_IN || "7d";
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    secret,
    { expiresIn }
  );
}

/**
 * Sanitize user object for response (never return password_hash)
 */
function sanitizeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatar_url,
    role: user.role,
    status: user.status,
    hasPassword: Boolean(user.password_hash),
    isGoogleLinked: Boolean(user.google_id),
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  };
}

/**
 * Validates password strength:
 * - At least 8 characters
 * - At least 1 lowercase letter
 * - At least 1 uppercase letter
 * - At least 1 digit
 */
function validatePasswordStrength(password) {
  if (typeof password !== "string" || password.length < 8) {
    return "Password must be at least 8 characters long.";
  }
  if (!/[a-z]/.test(password)) {
    return "Password must contain at least one lowercase letter.";
  }
  if (!/[A-Z]/.test(password)) {
    return "Password must contain at least one uppercase letter.";
  }
  if (!/[0-9]/.test(password)) {
    return "Password must contain at least one number.";
  }
  return null;
}

const AuthController = {
  /**
   * User Sign Up with Email & Password
   */
  async signup(req, res) {
    try {
      const { name, email, password, confirmPassword } = req.body;

      // 1. Validate required fields
      if (!name || !email || !password || !confirmPassword) {
        return res.status(400).json({
          success: false,
          message: "All fields (name, email, password, confirm password) are required.",
        });
      }

      const trimmedName = name.trim();
      const trimmedEmail = email.trim().toLowerCase();

      if (trimmedName.length < 2 || trimmedName.length > 100) {
        return res.status(400).json({
          success: false,
          message: "Name must be between 2 and 100 characters.",
        });
      }

      // 2. Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        return res.status(400).json({
          success: false,
          message: "Please enter a valid email address.",
        });
      }

      // 3. Validate password strength
      const passwordError = validatePasswordStrength(password);
      if (passwordError) {
        return res.status(400).json({
          success: false,
          message: passwordError,
        });
      }

      // 4. Validate password confirmation
      if (password !== confirmPassword) {
        return res.status(400).json({
          success: false,
          message: "Password and Confirm Password do not match.",
        });
      }

      // 5. Prevent duplicate email
      const existingUser = await UserModel.findByEmail(trimmedEmail);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: "An account with this email address already exists. Please sign in instead.",
        });
      }

      // 6. Hash password with bcryptjs (12 salt rounds)
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // 7. Create user in database (always USER role, never trust frontend role)
      const newUser = await UserModel.create({
        name: trimmedName,
        email: trimmedEmail,
        passwordHash,
        role: "USER",
      });

      // 8. Generate JWT & set HttpOnly cookie
      const token = generateToken(newUser);
      res.cookie("token", token, getCookieOptions());

      return res.status(201).json({
        success: true,
        message: "Account created successfully.",
        token,
        user: sanitizeUser(newUser),
      });
    } catch (error) {
      console.error("Signup error:", error);
      return res.status(500).json({
        success: false,
        message: "An error occurred while creating your account. Please try again.",
      });
    }
  },

  /**
   * User Login with Email & Password
   */
  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: "Email and password are required.",
        });
      }

      const trimmedEmail = email.trim().toLowerCase();
      const user = await UserModel.findByEmail(trimmedEmail);

      // Generic error to prevent email enumeration
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Invalid email or password.",
        });
      }

      // Check if account is disabled
      if (user.status === "DISABLED") {
        return res.status(403).json({
          success: false,
          code: "ACCOUNT_DISABLED",
          message: "This account has been disabled. Please contact customer support.",
        });
      }

      // Check if user registered via Google only (no password set)
      if (!user.password_hash) {
        return res.status(400).json({
          success: false,
          code: "GOOGLE_ACCOUNT_ONLY",
          message: "This account was registered using Google. Please click 'Continue with Google' to sign in.",
        });
      }

      // Compare password
      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: "Invalid email or password.",
        });
      }

      // Generate JWT & set HttpOnly cookie
      const token = generateToken(user);
      res.cookie("token", token, getCookieOptions());

      return res.json({
        success: true,
        message: "Signed in successfully.",
        token,
        user: sanitizeUser(user),
      });
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({
        success: false,
        message: "An error occurred while signing in. Please try again.",
      });
    }
  },

  /**
   * Google OAuth Sign In / Sign Up
   */
  async googleAuth(req, res) {
    try {
      const { credential, idToken, accessToken } = req.body;
      const tokenToVerify = credential || idToken;

      if (!tokenToVerify && !accessToken) {
        return res.status(400).json({
          success: false,
          message: "Google credential ID token or access token is required.",
        });
      }

      const clientId = process.env.GOOGLE_CLIENT_ID;
      if (!clientId || clientId.includes("your-google-client-id")) {
        return res.status(503).json({
          success: false,
          code: "GOOGLE_AUTH_NOT_CONFIGURED",
          message: "Google OAuth is not configured on this server. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in the server environment variables.",
        });
      }

      let googleId;
      let email;
      let name;
      let picture;
      let email_verified;

      if (tokenToVerify) {
        // Verify Google ID Token with Google's public keys
        let ticket;
        try {
          ticket = await googleClient.verifyIdToken({
            idToken: tokenToVerify,
            audience: clientId,
          });
        } catch (verifyErr) {
          console.error("Google token verification failed:", verifyErr.message);
          return res.status(401).json({
            success: false,
            message: "Invalid or expired Google credential token.",
          });
        }

        const payload = ticket.getPayload();
        if (!payload) {
          return res.status(401).json({
            success: false,
            message: "Unable to retrieve user information from Google.",
          });
        }

        googleId = payload.sub;
        email = payload.email;
        name = payload.name;
        picture = payload.picture;
        email_verified = payload.email_verified;
      } else {
        // Verify via Google UserInfo API using Access Token
        const googleRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!googleRes.ok) {
          return res.status(401).json({
            success: false,
            message: "Invalid or expired Google access token.",
          });
        }

        const data = await googleRes.json();
        googleId = data.sub;
        email = data.email;
        name = data.name;
        picture = data.picture;
        email_verified = data.email_verified;
      }

      if (!email_verified) {
        return res.status(400).json({
          success: false,
          message: "Google email address has not been verified by Google.",
        });
      }

      const normalizedEmail = email.toLowerCase().trim();

      // Check if user exists by google_id
      let user = await UserModel.findByGoogleId(googleId);

      if (user) {
        // User exists by Google ID
        if (user.status === "DISABLED") {
          return res.status(403).json({
            success: false,
            code: "ACCOUNT_DISABLED",
            message: "This account has been disabled. Please contact customer support.",
          });
        }
      } else {
        // Check if a user with this email already exists (e.g. registered via email/password)
        const existingEmailUser = await UserModel.findByEmail(normalizedEmail);

        if (existingEmailUser) {
          // Check if disabled
          if (existingEmailUser.status === "DISABLED") {
            return res.status(403).json({
              success: false,
              code: "ACCOUNT_DISABLED",
              message: "This account has been disabled. Please contact customer support.",
            });
          }

          // Safely link Google ID to existing account
          user = await UserModel.linkGoogleAccount(
            existingEmailUser.id,
            googleId,
            picture || null
          );
        } else {
          // New user sign up via Google
          user = await UserModel.create({
            name: name || "Google User",
            email: normalizedEmail,
            passwordHash: null,
            googleId,
            avatarUrl: picture || null,
            role: "USER",
          });
        }
      }

      // Issue JWT token & set HttpOnly cookie
      const token = generateToken(user);
      res.cookie("token", token, getCookieOptions());

      return res.json({
        success: true,
        message: "Signed in with Google successfully.",
        token,
        user: sanitizeUser(user),
      });
    } catch (error) {
      console.error("Google Auth error:", error);
      return res.status(500).json({
        success: false,
        message: "An error occurred during Google authentication. Please try again.",
      });
    }
  },

  /**
   * User Logout
   */
  async logout(req, res) {
    try {
      res.clearCookie("token", getCookieOptions());
      return res.json({
        success: true,
        message: "Logged out successfully.",
      });
    } catch (error) {
      console.error("Logout error:", error);
      return res.status(500).json({
        success: false,
        message: "An error occurred while logging out.",
      });
    }
  },

  /**
   * Get current authenticated user profile
   */
  async getMe(req, res) {
    try {
      // req.user was populated by authenticateToken middleware
      return res.json({
        success: true,
        user: sanitizeUser(req.user),
      });
    } catch (error) {
      console.error("GetMe error:", error);
      return res.status(500).json({
        success: false,
        message: "An error occurred retrieving user profile.",
      });
    }
  },

  /**
   * Update profile (name, avatarUrl)
   */
  async updateProfile(req, res) {
    try {
      const { name, avatarUrl } = req.body;
      const updatedUser = await UserModel.updateProfile(req.user.id, {
        name,
        avatarUrl,
      });

      return res.json({
        success: true,
        message: "Profile updated successfully.",
        user: sanitizeUser(updatedUser),
      });
    } catch (error) {
      console.error("Update profile error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to update profile.",
      });
    }
  },
};

module.exports = AuthController;
