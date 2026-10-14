const jwt = require("jsonwebtoken");
const UserModel = require("../models/userModel");

/**
 * Middleware to authenticate requests via JWT stored in HttpOnly cookie or Bearer token header.
 */
async function authenticateToken(req, res, next) {
  try {
    let token = null;

    // Check HttpOnly cookie first
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }
    // Fallback to Authorization: Bearer <token> header
    else if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please sign in.",
      });
    }

    const secret = process.env.JWT_SECRET || "default_dev_secret_handicraft_2026";
    let decoded;
    try {
      decoded = jwt.verify(token, secret);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          code: "TOKEN_EXPIRED",
          message: "Session expired. Please sign in again.",
        });
      }
      return res.status(401).json({
        success: false,
        code: "INVALID_TOKEN",
        message: "Invalid authentication token. Please sign in again.",
      });
    }

    // Verify user exists in database and is ACTIVE
    const user = await UserModel.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User account no longer exists.",
      });
    }

    if (user.status === "DISABLED") {
      return res.status(403).json({
        success: false,
        code: "ACCOUNT_DISABLED",
        message: "Your account has been disabled. Please contact customer support.",
      });
    }

    // Attach fresh user details to request
    req.user = user;
    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error);
    return res.status(500).json({
      success: false,
      message: "An internal authentication error occurred.",
    });
  }
}

/**
 * Middleware to restrict access to specific roles (e.g. ADMIN)
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        code: "FORBIDDEN",
        message: "Access forbidden: you do not have permission to access this resource.",
      });
    }

    next();
  };
}

module.exports = {
  authenticateToken,
  requireRole,
};
