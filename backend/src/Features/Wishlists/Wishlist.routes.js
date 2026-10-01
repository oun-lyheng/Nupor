const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../../middlewares/authenticate");

const {
  toggleWishlistController,
  getUserWishlistController,
  removeFromWishlistController,
} = require("./Wishlist.controller");

// All wishlist routes require authentication
router.get("/wishlist", authenticateToken, getUserWishlistController);
router.post("/wishlist/:productId/toggle", authenticateToken, toggleWishlistController);
router.delete("/wishlist/:productId", authenticateToken, removeFromWishlistController);

module.exports = router;
