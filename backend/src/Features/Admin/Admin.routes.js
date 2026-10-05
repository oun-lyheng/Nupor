const express = require("express");
const router = express.Router();
const {
  getPlatformOverviewController,
  getUsersListController,
  toggleUserBlockController,
  getAllProductsAdminController,
  updateProductStatusController,
  getAllOrdersAdminController,
  getAdminNotificationsController,
  markAdminNotificationAsReadController,
  markAllAdminNotificationsAsReadController,
} = require("./Admin.controller");
const { authenticateToken, requireAdmin } = require("../../middlewares/authenticate");

// Admin routes: must be authenticated and have role 'admin'
router.use(authenticateToken, requireAdmin);

router.get("/admin/overview", getPlatformOverviewController);
router.get("/admin/users", getUsersListController);
router.patch("/admin/users/:id/block", toggleUserBlockController);
router.get("/admin/products", getAllProductsAdminController);
router.patch("/admin/products/:id/status", updateProductStatusController);
router.get("/admin/orders", getAllOrdersAdminController);

// In-App Admin Notifications
router.get("/admin/notifications", getAdminNotificationsController);
router.patch("/admin/notifications/read-all", markAllAdminNotificationsAsReadController);
router.patch("/admin/notifications/:id/read", markAdminNotificationAsReadController);

module.exports = router;
