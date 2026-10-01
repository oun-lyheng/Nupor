const {
  createProductReview,
  updateReview,
  deleteReview,
  getProductReviews,
} = require("./Review.service");

// CREATE REVIEW
const createProductReviewController = async (req, res) => {
  try {
    const userId = req.user.id;
    const productId = req.params.productId;
    const { rating, comment } = req.body;

    const result = await createProductReview({
      userId,
      productId,
      rating,
      comment,
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

// UPDATE REVIEW
const updateReviewController = async (req, res) => {
  try {
    const userId = req.user.id;
    const reviewId = req.params.id;
    const { rating, comment } = req.body;

    const result = await updateReview({
      reviewId,
      userId,
      rating,
      comment,
    });

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

// DELETE REVIEW
const deleteReviewController = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;
    const reviewId = req.params.id;

    const result = await deleteReview({
      reviewId,
      userId,
      role,
    });

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

// GET PRODUCT REVIEWS
const getProductReviewsController = async (req, res) => {
  try {
    const productId = req.params.productId;
    const { page, limit } = req.query;

    const result = await getProductReviews({
      productId,
      page,
      limit,
    });

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

module.exports = {
  createProductReviewController,
  updateReviewController,
  deleteReviewController,
  getProductReviewsController,
};
