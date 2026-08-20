const express = require("express");
const router = express.Router();
const upload = require("../../middlewares/upload.middleware");
const { authenticateToken } = require("../../middlewares/authenticate");

const {
  getProductImagesController,
  createProductImageController,
  updateProductImageController,
  removeProductImageController,
} = require("./ProductImage.controller");

// Public route to view images of a product
// router.get("/products/:productId/images", getProductImagesController);

// Protected routes for product sellers
router.post(
  "/product/:productId/image",
  authenticateToken,
  upload.single("image"),
  createProductImageController
);

router.put(
  "/product/:productId/image/:imageId",
  authenticateToken,
  upload.single("image"),
  updateProductImageController
);

router.delete(
  "/product/:productId/image/:imageId",
  authenticateToken,
  removeProductImageController
);

module.exports = router;
