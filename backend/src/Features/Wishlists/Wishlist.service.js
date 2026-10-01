const { wishlists, products, productImages } = require("../../models");
const { throwError } = require("../../utils/appError");

/**
 * TOGGLE PRODUCT IN WISHLIST (Heart button click)
 * Adds if not in wishlist, removes if already in wishlist
 */
const toggleWishlist = async ({ userId, productId }) => {
  if (!productId) {
    throwError("Please provide productId!", 400);
  }

  const targetProductId = parseInt(productId, 10);

  // Verify product exists
  const product = await products.findOne({
    where: { id: targetProductId, isActive: true },
  });

  if (!product) {
    throwError("Product not found or is inactive!", 404);
  }

  const existing = await wishlists.findOne({
    where: { userId, productId: targetProductId },
  });

  if (existing) {
    await existing.destroy();
    return {
      message: "Product removed from wishlist",
      data: {
        productId: targetProductId,
        inWishlist: false,
      },
    };
  } else {
    await wishlists.create({
      userId,
      productId: targetProductId,
    });
    return {
      message: "Product added to wishlist",
      data: {
        productId: targetProductId,
        inWishlist: true,
      },
    };
  }
};

/**
 * GET BUYER'S WISHLIST ITEMS
 */
const getUserWishlist = async ({ userId, page = 1, limit = 20 }) => {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, parseInt(limit, 10) || 20);
  const offset = (pageNum - 1) * limitNum;

  const { count, rows } = await wishlists.findAndCountAll({
    where: { userId },
    include: [
      {
        model: products,
        as: "product",
        include: [{ model: productImages, as: "images" }],
      },
    ],
    order: [["createdAt", "DESC"]],
    limit: limitNum,
    offset,
  });

  // Format products and pick primary thumbnail
  const formattedItems = rows.map((item) => {
    const prod = item.product;
    let mainImageUrl = null;
    if (prod && prod.images && prod.images.length > 0) {
      const sortedImgs = [...prod.images].sort(
        (a, b) => a.position - b.position
      );
      mainImageUrl = sortedImgs[0].productImageUrl;
    }

    return {
      wishlistId: item.id,
      addedAt: item.createdAt,
      product: prod
        ? {
            id: prod.id,
            slug: prod.slug,
            productName: prod.productName,
            price: prod.price,
            originalPrice: prod.originalPrice,
            stock: prod.stock,
            isBestSeller: prod.isBestSeller,
            avgRating: prod.avgRating,
            imageUrl: mainImageUrl,
          }
        : null,
    };
  });

  return {
    message: "Wishlist retrieved successfully",
    data: {
      totalItems: count,
      items: formattedItems,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(count / limitNum),
        totalItems: count,
        limit: limitNum,
      },
    },
  };
};

/**
 * REMOVE PRODUCT FROM WISHLIST EXPLICITLY
 */
const removeFromWishlist = async ({ userId, productId }) => {
  if (!productId) {
    throwError("Please provide productId!", 400);
  }

  const targetProductId = parseInt(productId, 10);
  const item = await wishlists.findOne({
    where: { userId, productId: targetProductId },
  });

  if (!item) {
    throwError("Product not found in your wishlist!", 404);
  }

  await item.destroy();

  return {
    message: "Product removed from wishlist successfully",
    data: {
      productId: targetProductId,
      inWishlist: false,
    },
  };
};

module.exports = {
  toggleWishlist,
  getUserWishlist,
  removeFromWishlist,
};
