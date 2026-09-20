const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../../middlewares/authenticate");
const upload = require("../../middlewares/upload.middleware");

const {
  checkoutController,
  uploadPaymentReceiptController,
  confirmPaymentController,
  rejectPaymentController,
  getBuyerOrdersController,
  getOrderByIdController,
  getSellerOrdersController,
  updateOrderStatusController,
} = require("./Order.controller");

// All order endpoints require authentication

// 1. Checkout (Buyer checks out for a specific seller)
router.post("/orders/checkout", authenticateToken, checkoutController);

// 2. Upload Proof of Payment Receipt (Buyer uploads bank transfer screenshot)
router.post(
  "/orders/:id/receipt",
  authenticateToken,
  upload.single("receipt"),
  uploadPaymentReceiptController
);

// 3. Confirm / Reject Payment (Seller actions)
router.patch(
  "/orders/:id/confirm-payment",
  authenticateToken,
  confirmPaymentController
);
router.patch(
  "/orders/:id/reject-payment",
  authenticateToken,
  rejectPaymentController
);

// 4. Order Listing & Detail
router.get("/orders/seller", authenticateToken, getSellerOrdersController);
router.get("/orders", authenticateToken, getBuyerOrdersController);
router.get("/orders/:id", authenticateToken, getOrderByIdController);

// 5. Order Status Update (Cancel or Complete)
router.patch("/orders/:id/status", authenticateToken, updateOrderStatusController);

module.exports = router;
