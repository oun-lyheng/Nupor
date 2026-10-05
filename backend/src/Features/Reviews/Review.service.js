const {
  reviews,
  products,
  users,
  user_profiles,
  orders,
  orderItems,
  admin_notifications,
  sequelize,
} = require("../../models");
const { throwError } = require("../../utils/appError");

/**
 * Helper to recalculate and persist products.avgRating in DB
 */
const updateProductAvgRating = async (productId, transaction = null) => {
  const avg = await reviews.aggregate("rating", "avg", {
    where: { productId },
    transaction,
  });

  const avgRating = avg ? parseFloat(Number(avg).toFixed(2)) : 0.0;

  await products.update(
    { avgRating },
    { where: { id: productId }, transaction }
  );

  return avgRating;
};

/**
 * CREATE PRODUCT REVIEW
 */
const createProductReview = async ({ userId, productId, rating, comment }) => {
  if (!productId || rating === undefined || rating === null) {
    throwError("Please provide productId and rating!", 400);
  }

  const numRating = parseFloat(rating);
  if (isNaN(numRating) || numRating < 1.0 || numRating > 5.0) {
    throwError("Rating must be a number between 1.0 and 5.0!", 400);
  }

  const targetProductId = parseInt(productId, 10);

  // 1. Verify product exists and is active
  const product = await products.findOne({
    where: { id: targetProductId, isActive: true },
  });

  if (!product) {
    throwError("Product not found or is no longer available!", 404);
  }

  // 2. Prevent duplicate review by same buyer on same product
  const existingReview = await reviews.findOne({
    where: { userId, productId: targetProductId },
  });

  if (existingReview) {
    throwError(
      "You have already reviewed this product! Please update your existing review instead.",
      409
    );
  }

  // 3. Check for Verified Purchase badge
  const verifiedOrder = await orders.findOne({
    where: { buyerId: userId, orderStatus: "completed" },
    include: [
      {
        model: orderItems,
        as: "items",
        where: { productId: targetProductId },
      },
    ],
  });
  const isVerifiedPurchase = !!verifiedOrder;

  // 4. Save review and update product average rating atomically
  const result = await sequelize.transaction(async (t) => {
    const newReview = await reviews.create(
      {
        userId,
        productId: targetProductId,
        rating: numRating,
        comment: comment ? comment.trim() : null,
        isVerifiedPurchase,
      },
      { transaction: t }
    );

    const updatedAvgRating = await updateProductAvgRating(targetProductId, t);

    // Fetch review with reviewer details
    const populatedReview = await reviews.findOne({
      where: { id: newReview.id },
      include: [
        {
          model: users,
          as: "user",
          attributes: ["id", "fullName", "userName"],
          include: [
            {
              model: user_profiles,
              as: "profile",
              attributes: ["profile_url"],
            },
          ],
        },
      ],
      transaction: t,
    });

    return {
      message: "Review submitted successfully!",
      data: {
        review: populatedReview,
        productAvgRating: updatedAvgRating,
      },
    };
  });

  // 5. In-App Admin Notification for 1-Star / Negative Review
  if (numRating <= 1.0) {
    try {
      const seller = await users.findByPk(product.userId, {
        attributes: ["id", "fullName", "userName"],
      });
      const sellerName = seller?.fullName || seller?.userName || "Seller";
      const cleanComment = comment && comment.trim().length > 0 ? comment.trim() : "No comment";

      await admin_notifications.create({
        type: "low_rating_review",
        title: "⭐ 1-Star Review Alert!",
        message: `Customer left a ${numRating.toFixed(1)} rating on '${product.productName}': '${cleanComment}'. Seller: ${sellerName}.`,
        data: {
          reviewId: result.data.review.id,
          productId: product.id,
          productName: product.productName,
          rating: numRating,
          comment: cleanComment,
          sellerId: product.userId,
          sellerName,
          buyerId: userId,
        },
      });
    } catch (notifErr) {
      console.error("Failed to create admin notification for 1-star review:", notifErr.message);
    }
  }

  return result;
};

/**
 * UPDATE REVIEW (Buyer can edit their own rating or comment)
 */
const updateReview = async ({ reviewId, userId, rating, comment }) => {
  const targetReviewId = parseInt(reviewId, 10);
  const review = await reviews.findByPk(targetReviewId);

  if (!review) {
    throwError("Review not found!", 404);
  }

  if (review.userId !== userId) {
    throwError("You are not authorized to update this review!", 403);
  }

  let numRating = review.rating;
  if (rating !== undefined && rating !== null) {
    numRating = parseFloat(rating);
    if (isNaN(numRating) || numRating < 1.0 || numRating > 5.0) {
      throwError("Rating must be a number between 1.0 and 5.0!", 400);
    }
  }

  const result = await sequelize.transaction(async (t) => {
    review.rating = numRating;
    if (comment !== undefined) {
      review.comment = comment ? comment.trim() : null;
    }
    await review.save({ transaction: t });

    const updatedAvgRating = await updateProductAvgRating(review.productId, t);

    const updatedReview = await reviews.findOne({
      where: { id: review.id },
      include: [
        {
          model: users,
          as: "user",
          attributes: ["id", "fullName", "userName"],
          include: [
            {
              model: user_profiles,
              as: "profile",
              attributes: ["profile_url"],
            },
          ],
        },
      ],
      transaction: t,
    });

    return {
      message: "Review updated successfully!",
      data: {
        review: updatedReview,
        productAvgRating: updatedAvgRating,
      },
    };
  });

  // In-App Admin Notification if updated to 1-Star / Negative Review
  if (numRating <= 1.0) {
    try {
      const product = await products.findByPk(review.productId, {
        attributes: ["id", "productName", "userId"],
      });
      if (product) {
        const seller = await users.findByPk(product.userId, {
          attributes: ["id", "fullName", "userName"],
        });
        const sellerName = seller?.fullName || seller?.userName || "Seller";
        const cleanComment = review.comment || "No comment";

        await admin_notifications.create({
          type: "low_rating_review",
          title: "⭐ 1-Star Review Alert!",
          message: `Customer left a ${numRating.toFixed(1)} rating on '${product.productName}': '${cleanComment}'. Seller: ${sellerName}.`,
          data: {
            reviewId: review.id,
            productId: product.id,
            productName: product.productName,
            rating: numRating,
            comment: cleanComment,
            sellerId: product.userId,
            sellerName,
            buyerId: userId,
            isUpdated: true,
          },
        });
      }
    } catch (notifErr) {
      console.error("Failed to create admin notification for updated 1-star review:", notifErr.message);
    }
  }

  return result;
};

/**
 * DELETE REVIEW (Author or Admin)
 */
const deleteReview = async ({ reviewId, userId, role }) => {
  const targetReviewId = parseInt(reviewId, 10);
  const review = await reviews.findByPk(targetReviewId);

  if (!review) {
    throwError("Review not found!", 404);
  }

  const isAuthor = review.userId === userId;
  const isAdmin = role === "admin";

  if (!isAuthor && !isAdmin) {
    throwError("You are not authorized to delete this review!", 403);
  }

  const productId = review.productId;

  return await sequelize.transaction(async (t) => {
    await review.destroy({ transaction: t });
    const updatedAvgRating = await updateProductAvgRating(productId, t);

    return {
      message: "Review deleted successfully!",
      data: {
        productId,
        productAvgRating: updatedAvgRating,
      },
    };
  });
};

/**
 * GET REVIEWS FOR A PRODUCT WITH STAR BREAKDOWN SUMMARY & PAGINATION
 */
const getProductReviews = async ({ productId, page = 1, limit = 10 }) => {
  const targetProductId = parseInt(productId, 10);

  const product = await products.findOne({
    where: { id: targetProductId, isActive: true },
    attributes: ["id", "productName", "avgRating"],
  });

  if (!product) {
    throwError("Product not found!", 404);
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, parseInt(limit, 10) || 10);
  const offset = (pageNum - 1) * limitNum;

  const { count, rows } = await reviews.findAndCountAll({
    where: { productId: targetProductId },
    include: [
      {
        model: users,
        as: "user",
        attributes: ["id", "fullName", "userName"],
        include: [
          {
            model: user_profiles,
            as: "profile",
            attributes: ["profile_url"],
          },
        ],
      },
    ],
    order: [["createdAt", "DESC"]],
    limit: limitNum,
    offset,
  });

  // Calculate star counts distribution for UI (5 star, 4 star, etc.)
  const allRatings = await reviews.findAll({
    where: { productId: targetProductId },
    attributes: ["rating"],
  });

  const starBreakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  allRatings.forEach((r) => {
    const star = Math.floor(parseFloat(r.rating));
    if (star >= 1 && star <= 5) {
      starBreakdown[star] += 1;
    }
  });

  return {
    message: "Reviews retrieved successfully",
    data: {
      summary: {
        totalReviews: count,
        avgRating: parseFloat(product.avgRating),
        starBreakdown,
      },
      reviews: rows,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(count / limitNum),
        totalItems: count,
        limit: limitNum,
      },
    },
  };
};

module.exports = {
  createProductReview,
  updateReview,
  deleteReview,
  getProductReviews,
};
