const UserModel = require("../models/userModel");

const AdminController = {
  /**
   * Get Admin dashboard metrics & user summary
   */
  async getDashboard(req, res) {
    try {
      const stats = await UserModel.getStats();
      return res.json({
        success: true,
        stats,
      });
    } catch (error) {
      console.error("Admin getDashboard error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to load admin dashboard data.",
      });
    }
  },

  /**
   * List all registered users
   */
  async getUsers(req, res) {
    try {
      const users = await UserModel.findAll();
      return res.json({
        success: true,
        users,
      });
    } catch (error) {
      console.error("Admin getUsers error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to retrieve user list.",
      });
    }
  },

  /**
   * Update user account status (ACTIVE or DISABLED)
   */
  async updateUserStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!["ACTIVE", "DISABLED"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid status. Must be 'ACTIVE' or 'DISABLED'.",
        });
      }

      // Prevent admin from disabling themselves
      if (Number(id) === req.user.id && status === "DISABLED") {
        return res.status(400).json({
          success: false,
          message: "You cannot disable your own administrator account.",
        });
      }

      const updatedUser = await UserModel.updateStatus(id, status);
      if (!updatedUser) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }

      return res.json({
        success: true,
        message: `User account status updated to ${status}.`,
        user: updatedUser,
      });
    } catch (error) {
      console.error("Admin updateUserStatus error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to update user status.",
      });
    }
  },

  /**
   * Update user role (USER or ADMIN)
   */
  async updateUserRole(req, res) {
    try {
      const { id } = req.params;
      const { role } = req.body;

      if (!["USER", "ADMIN"].includes(role)) {
        return res.status(400).json({
          success: false,
          message: "Invalid role. Must be 'USER' or 'ADMIN'.",
        });
      }

      // Prevent admin from demoting themselves
      if (Number(id) === req.user.id && role !== "ADMIN") {
        return res.status(400).json({
          success: false,
          message: "You cannot revoke your own administrator role.",
        });
      }

      const updatedUser = await UserModel.updateRole(id, role);
      if (!updatedUser) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }

      return res.json({
        success: true,
        message: `User role updated to ${role}.`,
        user: updatedUser,
      });
    } catch (error) {
      console.error("Admin updateUserRole error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to update user role.",
      });
    }
  },
};

module.exports = AdminController;
