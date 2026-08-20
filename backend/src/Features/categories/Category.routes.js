const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../../middlewares/authenticate");

const {
  createCategoryController,
  readCategoriesController,
  updateCategoryController,
  deleteCategoryController,
} = require("./Category.controller");

router.get("/category", readCategoriesController);

// Protected routes (Admin / Authorized Users)
router.post("/category", authenticateToken, createCategoryController);
router.put("/category/:id", authenticateToken, updateCategoryController);
router.delete("/category/:id", authenticateToken, deleteCategoryController);

module.exports = router;
