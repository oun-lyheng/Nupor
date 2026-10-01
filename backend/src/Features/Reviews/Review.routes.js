const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../../middlewares/authenticate");

const {
  createProductReviewController,
  updateReviewController,
  deleteReviewController,
  getProductReviewsController,
} = require("./Review.controller");

// Public: view reviews for a product
router.get("/products/:productId/reviews", getProductReviewsController);

// Protected: submit, edit, or delete a review
router.post(
  "/products/:productId/reviews",
  authenticateToken,
  createProductReviewController
);
router.put("/reviews/:id", authenticateToken, updateReviewController);
router.delete("/reviews/:id", authenticateToken, deleteReviewController);

module.exports = router;
