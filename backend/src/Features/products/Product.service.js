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

// GET ALL PRODUCTS FOR PUBLIC (Search, Filter, Sort, Paginate)
const getAllProducts = async ({
  q,
  categoryId,
  categorySlug,
  minPrice,
  maxPrice,
  minRating,
  inStock,
  sellerId,
  sortBy = "newest",
  page = 1,
  limit = 12,
} = {}) => {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, parseInt(limit, 10) || 12);
  const offset = (pageNum - 1) * limitNum;

  const whereConditions = { isActive: true };

  // 1. Keyword search across productName and description
  if (q && q.trim()) {
    const term = `%${q.trim()}%`;
    whereConditions[Op.or] = [
      { productName: { [Op.iLike]: term } },
      { description: { [Op.iLike]: term } },
    ];
  }

  // 2. Price filtering
  if (minPrice !== undefined && minPrice !== null && minPrice !== "") {
    whereConditions.price = whereConditions.price || {};
    whereConditions.price[Op.gte] = parseFloat(minPrice);
  }
  if (maxPrice !== undefined && maxPrice !== null && maxPrice !== "") {
    whereConditions.price = whereConditions.price || {};
    whereConditions.price[Op.lte] = parseFloat(maxPrice);
  }

  // 3. Rating filtering
  if (minRating !== undefined && minRating !== null && minRating !== "") {
    whereConditions.avgRating = { [Op.gte]: parseFloat(minRating) };
  }

  // 4. In-stock filter
  if (inStock === "true" || inStock === true) {
    whereConditions.stock = { [Op.gt]: 0 };
  }

  // 5. Seller filter
  if (sellerId) {
    whereConditions.userId = parseInt(sellerId, 10);
  }

  // 6. Category filtering
  const categoryInclude = {
    model: categories,
    as: "categories",
    through: { attributes: [] },
  };
  if (categoryId) {
    categoryInclude.where = { id: parseInt(categoryId, 10) };
  } else if (categorySlug) {
    categoryInclude.where = { slug: categorySlug.trim() };
  }

  // 7. Sorting
  let orderClause = [["createdAt", "DESC"]];
  if (sortBy === "price_asc") {
    orderClause = [["price", "ASC"]];
  } else if (sortBy === "price_desc") {
    orderClause = [["price", "DESC"]];
  } else if (sortBy === "top_rated") {
    orderClause = [
      ["avgRating", "DESC"],
      ["createdAt", "DESC"],
    ];
  } else if (sortBy === "best_seller") {
    orderClause = [
      ["isBestSeller", "DESC"],
      ["createdAt", "DESC"],
    ];
  } else if (sortBy === "newest") {
    orderClause = [["createdAt", "DESC"]];
  }

  orderClause.push([{ model: productImages, as: "images" }, "position", "ASC"]);

  // 8. Query with distinct count for accurate pagination
  const { count, rows } = await products.findAndCountAll({
    where: whereConditions,
    include: [
      {
        model: productImages,
        as: "images",
      },
      categoryInclude,
    ],
    order: orderClause,
    limit: limitNum,
    offset,
    distinct: true,
  });

  return {
    message: "Get all products successfully!",
    data: {
      totalItems: count,
      products: rows,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(count / limitNum),
        totalItems: count,
        limit: limitNum,
      },
    },
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
