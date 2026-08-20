const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../../middlewares/authenticate");

const {
  createProductController,
  getAllProductsController,
  getProductByIdController,
  updateProductByIdController,
  removeProductController,
} = require("./Product.controller");

// Public routes
router.get("/product", getAllProductsController);
router.get("/product/:id", getProductByIdController);

// Protected routes (Sellers)
router.post("/product", authenticateToken, createProductController);
router.put("/product/:id", authenticateToken, updateProductByIdController);
router.delete("/product/:id", authenticateToken, removeProductController);

module.exports = router;