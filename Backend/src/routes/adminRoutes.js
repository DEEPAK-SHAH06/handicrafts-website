const express = require("express");
const router = express.Router();
const AdminController = require("../controllers/adminController");
const { authenticateToken, requireRole } = require("../middleware/authMiddleware");

// All admin routes require authentication and ADMIN role
router.use(authenticateToken);
router.use(requireRole("ADMIN"));

router.get("/dashboard", AdminController.getDashboard);
router.get("/users", AdminController.getUsers);
router.patch("/users/:id/status", AdminController.updateUserStatus);
router.patch("/users/:id/role", AdminController.updateUserRole);

module.exports = router;
