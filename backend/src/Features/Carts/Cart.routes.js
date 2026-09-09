const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../../middlewares/authenticate");

const {
  getBuyerCartController,
  addProductToCartController,
  updateCartItemQuantityController,
  removeProductFromCartController,
  clearCartController,
} = require("./Cart.controller");

// All Cart routes are protected (Buyer must be logged in)
router.get("/cart", authenticateToken, getBuyerCartController);
router.post("/cart/items", authenticateToken, addProductToCartController);
router.put("/cart/items/:productId", authenticateToken, updateCartItemQuantityController);
router.delete("/cart/items/:productId", authenticateToken, removeProductFromCartController);
router.delete("/cart", authenticateToken, clearCartController);

module.exports = router;
