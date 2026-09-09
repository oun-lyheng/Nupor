const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../../middlewares/authenticate");

const {
  checkoutController,
  getBuyerOrdersController,
  getOrderByIdController,
  getSellerSoldItemsController,
  updateOrderStatusController,
} = require("./Order.controller");

// All order endpoints require authentication
router.post("/orders/checkout", authenticateToken, checkoutController);
router.get("/orders", authenticateToken, getBuyerOrdersController);
router.get("/orders/seller/sold", authenticateToken, getSellerSoldItemsController);
router.get("/orders/:id", authenticateToken, getOrderByIdController);
router.patch("/orders/:id/status", authenticateToken, updateOrderStatusController);

module.exports = router;
