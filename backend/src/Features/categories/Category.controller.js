const {
  createCategory,
  getAllCategories,
  updateCategory,
  deleteCategory,
} = require("./Category.service");

// CREATE CATEGORY
const createCategoryController = async (req, res) => {
  try {
    const { categoryName } = req.body;

    const result = await createCategory({
      categoryName,
    });

    return res.status(201).json({
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    const statusCode = error.status || 500;
    return res.status(statusCode).json({
      message: error.message,
    });
  }
};

// READ CATEGORIES
const readCategoriesController = async (req, res) => {
  try {
    const { slug } = req.query;

    const result = await getAllCategories(slug);

    return res.status(200).json({
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    const statusCode = error.status || 500;
    return res.status(statusCode).json({
      message: error.message,
    });
  }
};

// UPDATE CATEGORIES
const updateCategoryController = async (req, res) => {
  try {
    const { id } = req.params;
    const { categoryName } = req.body;

    const result = await updateCategory({ id, categoryName });

    return res.status(200).json({
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    const statusCode = error.status || 500;
    return res.status(statusCode).json({
      message: error.message,
    });
  }
};

// DELETE CATEGORY
const deleteCategoryController = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await deleteCategory(id);

    return res.status(200).json({
      message: result.message,
    });
  } catch (error) {
    const statusCode = error.status || 500;
    return res.status(statusCode).json({
      message: error.message,
    });
  }
};

module.exports = {
  createCategoryController,
  readCategoriesController,
  updateCategoryController,
  deleteCategoryController,
};