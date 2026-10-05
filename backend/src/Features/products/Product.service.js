const {
  products,
  categories,
  productCategories,
  productImages,
  product_variants,
  admin_notifications,
  users,
  user_profiles,
} = require("../../models");
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

// Helper function to sync product stock from its variants
const syncProductStockFromVariants = async (productId) => {
  const variantCount = await product_variants.count({
    where: { productId, isActive: true },
  });

  if (variantCount > 0) {
    const totalStock = await product_variants.sum("stock", {
      where: { productId, isActive: true },
    });
    await products.update(
      { stock: totalStock || 0 },
      { where: { id: productId } }
    );
  }
};

// CREATE PRODUCT (Supports optional variants array)
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
  variants = [],
}) => {
  if (!productName || !description || price === undefined) {
    throwError("Please provide all required product fields!", 400);
  }

  if (!userId) {
    throwError("User Id is required!", 400);
  }

  // If variants provided, calculate total stock from variants if stock is not provided
  let calculatedStock = stock !== undefined ? parseInt(stock, 10) : 0;
  if (Array.isArray(variants) && variants.length > 0) {
    const variantTotal = variants.reduce((sum, v) => sum + (parseInt(v.stock, 10) || 0), 0);
    calculatedStock = variantTotal;
  }

  const slugName = await generateUniqueProductSlug(productName);

  const product = await products.create({
    slug: slugName,
    productName,
    description,
    price,
    originalPrice: originalPrice !== undefined ? originalPrice : price,
    stock: calculatedStock,
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

  // Create variants if provided
  if (Array.isArray(variants) && variants.length > 0) {
    for (const v of variants) {
      if (!v.variantName) continue;
      await product_variants.create({
        productId: product.id,
        variantName: v.variantName,
        price: v.price !== undefined ? v.price : price,
        originalPrice: v.originalPrice !== undefined ? v.originalPrice : (originalPrice || price),
        stock: v.stock !== undefined ? parseInt(v.stock, 10) : 0,
        sku: v.sku || null,
        attributes: v.attributes || null,
        imageUrl: v.imageUrl || null,
        isActive: v.isActive !== undefined ? Boolean(v.isActive) : true,
      });
    }
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
      {
        model: product_variants,
        as: "variants",
        where: { isActive: true },
        required: false,
      },
    ],
    order: [[{ model: productImages, as: "images" }, "position", "ASC"]],
  });

  // Create Admin Notification for New Product Listing
  try {
    const seller = await users.findByPk(userId, { attributes: ["id", "fullName", "userName"] });
    const sellerName = seller?.fullName || seller?.userName || "Seller";
    await admin_notifications.create({
      type: "new_product_listing",
      title: "📦 New Product Listed",
      message: `📦 New Product Listed: '${fullProduct.productName}' ($${parseFloat(fullProduct.price).toFixed(2)}) added by seller ${sellerName}.`,
      data: {
        productId: fullProduct.id,
        productName: fullProduct.productName,
        price: parseFloat(fullProduct.price).toFixed(2),
        sellerId: userId,
        sellerName,
      },
    });
  } catch (notifErr) {
    console.error("Failed to create admin notification for product:", notifErr.message);
  }

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
      {
        model: product_variants,
        as: "variants",
        where: { isActive: true },
        required: false,
      },
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
      {
        model: product_variants,
        as: "variants",
        where: { isActive: true },
        required: false,
      },
      {
        model: users,
        as: "seller",
        attributes: ["id", "fullName", "userName", "phoneNumber"],
        include: [
          {
            model: user_profiles,
            as: "profile",
            attributes: ["profile_url", "accountName", "telegramUsername"],
          },
        ],
      },
    ],
    order: [[{ model: productImages, as: "images" }, "position", "ASC"]],
  });

  if (!product) {
    throwError("Product not found with this ID!", 404);
  }

  const rawTelegram = product.seller?.profile?.telegramUsername;
  const sellerTelegramUsername = rawTelegram
    ? rawTelegram.replace(/^@+/, "").trim()
    : null;
  const inquiryMessage = `Hello! I saw your product "${product.productName}" ($${parseFloat(product.price).toFixed(2)}) on Nupor Marketplace. Is it still available?`;
  const telegramInquiryUrl = sellerTelegramUsername
    ? `https://t.me/${sellerTelegramUsername}?text=${encodeURIComponent(inquiryMessage)}`
    : null;

  return {
    message: "Get product details successfully!",
    data: {
      ...product.toJSON(),
      sellerTelegram: {
        username: sellerTelegramUsername,
        inquiryUrl: telegramInquiryUrl,
      },
    },
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
      {
        model: product_variants,
        as: "variants",
        where: { isActive: true },
        required: false,
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

// ADD VARIANT TO PRODUCT (Seller only)
const addVariantToProduct = async ({
  productId,
  userId,
  variantName,
  price,
  originalPrice,
  stock = 0,
  sku,
  attributes,
  imageUrl,
}) => {
  if (!productId || !variantName || price === undefined) {
    throwError("productId, variantName, and price are required!", 400);
  }

  const product = await products.findOne({ where: { id: productId, userId } });
  if (!product) {
    throwError("Product not found or unauthorized!", 404);
  }

  const variant = await product_variants.create({
    productId,
    variantName,
    price,
    originalPrice: originalPrice !== undefined ? originalPrice : price,
    stock: parseInt(stock, 10) || 0,
    sku: sku || null,
    attributes: attributes || null,
    imageUrl: imageUrl || null,
    isActive: true,
  });

  await syncProductStockFromVariants(productId);

  return {
    message: "Product variant added successfully!",
    data: variant,
  };
};

// UPDATE VARIANT (Seller only)
const updateVariant = async ({
  variantId,
  userId,
  variantName,
  price,
  originalPrice,
  stock,
  sku,
  attributes,
  imageUrl,
  isActive,
}) => {
  const variant = await product_variants.findByPk(variantId, {
    include: [{ model: products, as: "product" }],
  });

  if (!variant) {
    throwError("Variant not found!", 404);
  }

  if (variant.product.userId !== userId) {
    throwError("Unauthorized to update this variant!", 403);
  }

  if (variantName !== undefined) variant.variantName = variantName;
  if (price !== undefined) variant.price = price;
  if (originalPrice !== undefined) variant.originalPrice = originalPrice;
  if (stock !== undefined) variant.stock = parseInt(stock, 10);
  if (sku !== undefined) variant.sku = sku;
  if (attributes !== undefined) variant.attributes = attributes;
  if (imageUrl !== undefined) variant.imageUrl = imageUrl;
  if (isActive !== undefined) variant.isActive = Boolean(isActive);

  await variant.save();

  await syncProductStockFromVariants(variant.productId);

  return {
    message: "Product variant updated successfully!",
    data: variant,
  };
};

// DELETE VARIANT (Seller only)
const deleteVariant = async ({ variantId, userId }) => {
  const variant = await product_variants.findByPk(variantId, {
    include: [{ model: products, as: "product" }],
  });

  if (!variant) {
    throwError("Variant not found!", 404);
  }

  if (variant.product.userId !== userId) {
    throwError("Unauthorized to delete this variant!", 403);
  }

  const productId = variant.productId;
  await variant.destroy();

  await syncProductStockFromVariants(productId);

  return {
    message: "Product variant deleted successfully!",
  };
};

module.exports = {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  addVariantToProduct,
  updateVariant,
  deleteVariant,
};
