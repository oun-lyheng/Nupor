const { products, categories, productCategories, productImages } = require("../../models");
const { throwError } = require("../../utils/appError");
const slugify = require("slugify");
const crypto = require("crypto");
const { Op } = require("sequelize");

// Helper function to generate collision-free unique slugs
const generateUniqueProductSlug = async (productName, currentProductId = null) => {
  const baseSlug = slugify(productName, {
    lower: true,
    trim: true,
    replacement: "-",
    remove: /[*+~.()'"!:@#<>?]/g,
  });

  const whereCondition = { slug: baseSlug };
  if (currentProductId) {
    whereCondition.id = { [Op.ne]: currentProductId };
  }

  const existingSlug = await products.findOne({ where: whereCondition });

  // If baseSlug is not taken, use it directly
  if (!existingSlug) {
    return baseSlug;
  }

  // If taken, append a short unique 5-char hex suffix
  const randomSuffix = crypto.randomBytes(3).toString("hex");
  return `${baseSlug}-${randomSuffix}`;
};

// CREATE PRODUCT
const createProduct = async ({
  categoryIds,
  userId,
  productName,
  description,
  price,
  originalPrice,
  stock,
  isBestSeller = false,
  avgRating = 0.0,
  isActive = true,
}) => {
  if (!productName || !description || price === undefined || stock === undefined) {
    throwError("Please provide all required product fields!", 400);
  }

  if (!userId) {
    throwError("User Id is required!", 400);
  }

  const slugName = await generateUniqueProductSlug(productName);

  const product = await products.create({
    slug: slugName,
    productName,
    description,
    price,
    originalPrice: originalPrice !== undefined ? originalPrice : price,
    stock,
    isBestSeller,
    avgRating,
    isActive,
    userId,
  });

  // Link categories
  if (categoryIds) {
    const ids = Array.isArray(categoryIds) ? categoryIds : [categoryIds];
    await product.setCategories(ids);
  }

  const fullProduct = await products.findOne({
    where: { id: product.id },
    include: [
      {
        model: productImages,
        as: "images",
      },
      {
        model: categories,
        as: "categories",
        through: { attributes: [] },
      },
    ],
    order: [[{ model: productImages, as: "images" }, "position", "ASC"]],
  });

  return {
    message: "Product created successfully!",
    data: fullProduct,
  };
};

// GET ALL PRODUCTS FOR PUBLIC
const getAllProducts = async () => {
  const productList = await products.findAll({
    where: { isActive: true },
    include: [
      {
        model: productImages,
        as: "images",
      },
      {
        model: categories,
        as: "categories",
        through: { attributes: [] },
      },
    ],
    order: [
      ["id", "DESC"],
      [{ model: productImages, as: "images" }, "position", "ASC"],
    ],
  });

  return {
    message: "Get all products successfully!",
    data: productList,
  };
};

// GET PRODUCT BY ID
const getProductById = async (id) => {
  if (!id) {
    throwError("Product ID is required!", 400);
  }

  const product = await products.findOne({
    where: { id },
    include: [
      {
        model: productImages,
        as: "images",
      },
      {
        model: categories,
        as: "categories",
        through: { attributes: [] },
      },
    ],
    order: [[{ model: productImages, as: "images" }, "position", "ASC"]],
  });

  if (!product) {
    throwError("Product not found with this ID!", 404);
  }

  return {
    message: "Get product details successfully!",
    data: product,
  };
};

// UPDATE PRODUCT
const updateProduct = async ({
  id,
  userId,
  productName,
  description,
  price,
  originalPrice,
  stock,
  isBestSeller,
  isActive,
  categoryIds,
}) => {
  if (!id || !userId) {
    throwError("Product ID and User ID are required!", 400);
  }

  const product = await products.findOne({ where: { id, userId } });

  if (!product) {
    throwError("Product not found or unauthorized!", 404);
  }

  const updateData = {};

  if (productName) {
    updateData.productName = productName;
    updateData.slug = await generateUniqueProductSlug(productName, product.id);
  }

  if (description !== undefined) updateData.description = description;
  if (price !== undefined) updateData.price = price;
  if (originalPrice !== undefined) updateData.originalPrice = originalPrice;
  if (stock !== undefined) updateData.stock = stock;
  if (isBestSeller !== undefined) updateData.isBestSeller = isBestSeller;
  if (isActive !== undefined) updateData.isActive = isActive;

  await product.update(updateData);

  if (categoryIds !== undefined) {
    const ids = Array.isArray(categoryIds) ? categoryIds : [categoryIds];
    await product.setCategories(ids);
  }

  const updatedProduct = await products.findOne({
    where: { id: product.id },
    include: [
      {
        model: productImages,
        as: "images",
      },
      {
        model: categories,
        as: "categories",
        through: { attributes: [] },
      },
    ],
    order: [[{ model: productImages, as: "images" }, "position", "ASC"]],
  });

  return {
    message: "Update product successfully!",
    data: updatedProduct,
  };
};

// DELETE PRODUCT
const deleteProduct = async ({ id, userId }) => {
  if (!id || !userId) {
    throwError("Product ID and User ID are required!", 400);
  }

  const product = await products.findOne({ where: { id, userId } });

  if (!product) {
    throwError("Product not found with this ID or unauthorized!", 404);
  }

  await product.destroy();

  return {
    message: "Product deleted successfully!",
  };
};

module.exports = {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
};
