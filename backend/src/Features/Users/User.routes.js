const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../../middlewares/authenticate");
const upload = require("../../middlewares/upload.middleware");

const {
  getUserProfileController,
  updateUserProfileController,
  updateSellerPaymentInfoController,
  becomeSellerController,
} = require("./User.controller");

// All user profile endpoints require authentication
router.get("/users/profile", authenticateToken, getUserProfileController);

// Update profile (optional avatar image in field 'profileImage')
router.patch(
  "/users/profile",
  authenticateToken,
  upload.single("profileImage"),
  updateUserProfileController
);

// Seller setup: upload KHQR image (field 'khqr') + set bank account info
router.patch(
  "/users/seller/payment-info",
  authenticateToken,
  upload.single("khqr"),
  updateSellerPaymentInfoController
);

// Become a seller
router.post("/users/become-seller", authenticateToken, becomeSellerController);

module.exports = router;
