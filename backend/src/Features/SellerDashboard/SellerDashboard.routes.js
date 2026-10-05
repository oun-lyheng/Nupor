const express = require("express");
const router = express.Router();
const {
  getOverviewStatsController,
  getTopSellingProductsController,
  getRecentOrdersController,
  getDailySalesChartController,
} = require("./SellerDashboard.controller");
const { authenticateToken, requireSeller } = require("../../middlewares/authenticate");

// Seller dashboard routes: must be logged in and must be a seller (or admin)
router.use(authenticateToken, requireSeller);

router.get("/seller/dashboard/overview", getOverviewStatsController);
router.get("/seller/dashboard/top-products", getTopSellingProductsController);
router.get("/seller/dashboard/recent-orders", getRecentOrdersController);
router.get("/seller/dashboard/sales-chart", getDailySalesChartController);

module.exports = router;
