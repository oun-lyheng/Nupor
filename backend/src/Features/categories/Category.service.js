const { categories, products, productImages } = require("../../models");
const { throwError } = require("../../utils/appError");
const slugify = require("slugify");

// CREATE CATEGORY FOR ADMIN
const createCategory = async ({ categoryName }) => {
  if (!categoryName) {
    throwError("Please provide category name!", 400);
  }

  const existingCategory = await categories.findOne({
    where: { categoryName },
  });

  if (existingCategory) {
    throwError("This category already exists!", 400);
  }

  const slugName = slugify(categoryName, {
    lower: true,
    strict: true,
    replacement: "-",
    trim: true,
  });

  const category = await categories.create({
    categoryName,
    slug: slugName,
  });

  return {
    message: "Create category successfully!",
    data: category,
  };
};

// GET ALL CATEGORIES (OR GET SINGLE CATEGORY BY SLUG) FOR PUBLIC
const getAllCategories = async (slug) => {
  const whereCondition = slug ? { slug } : {};

  const categoryList = await categories.findAll({
    where: whereCondition,
    include: [
      {
        model: products,
        as: "products",
        where: { isActive: true },
        required: false,
        through: { attributes: [] },
        include: [
          {
            model: productImages,
            as: "images",
            required: false,
          },
        ],
      },
    ],
    order: [
      ["id", "ASC"],
      [{ model: products, as: "products" }, { model: productImages, as: "images" }, "position", "ASC"],
    ],
  });

  if (!categoryList || categoryList.length === 0) {
    if (slug) {
      throwError("Category not found!", 404);
    }
  }

  return {
    message: slug ? "Get category successfully!" : "Get all categories successfully!",
    data: slug ? categoryList[0] : categoryList,
  };
};

// UPDATE CATEGORY FOR ADMIN
const updateCategory = async ({ id, categoryName }) => {
  if (!id || !categoryName) {
    throwError("Please provide all the fields!", 400);
  }

  const existingCategory = await categories.findByPk(id);

  if (!existingCategory) {
    throwError("This category is not found!", 404);
  }

  const slugName = slugify(categoryName, {
    lower: true,
    strict: true,
    replacement: "-",
    trim: true,
  });

  const updatedCategory = await existingCategory.update({
    categoryName,
    slug: slugName,
  });

  return {
    message: "Update category successfully!",
    data: updatedCategory,
  };
};

// DELETE CATEGORY FOR ADMIN
const deleteCategory = async (idParam) => {
  const id = typeof idParam === "object" ? idParam.id : idParam;

  if (!id) {
    throwError("Category Id is required!", 400);
  }

  const existingCategory = await categories.findByPk(id);

  if (!existingCategory) {
    throwError("This category is not found!", 404);
  }

  await existingCategory.destroy();

  return {
    message: "Delete category successfully!",
  };
};

module.exports = {
  createCategory,
  getAllCategories,
  updateCategory,
  deleteCategory,
};
