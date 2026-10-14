const express = require("express");
const router = express.Router();
const AuthController = require("../controllers/authController");
const { authenticateToken } = require("../middleware/authMiddleware");

// Public endpoints
router.post("/signup", AuthController.signup);
router.post("/login", AuthController.login);
router.post("/google", AuthController.googleAuth);
router.post("/logout", AuthController.logout);

// Protected endpoints
router.get("/me", authenticateToken, AuthController.getMe);
router.put("/profile", authenticateToken, AuthController.updateProfile);

module.exports = router;
