const {
  toggleWishlist,
  getUserWishlist,
  removeFromWishlist,
} = require("./Wishlist.service");

// TOGGLE WISHLIST
const toggleWishlistController = async (req, res) => {
  try {
    const userId = req.user.id;
    const productId = req.params.productId || req.body.productId;

    const result = await toggleWishlist({ userId, productId });

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

// GET BUYER'S WISHLIST
const getUserWishlistController = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page, limit } = req.query;

    const result = await getUserWishlist({ userId, page, limit });

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

// REMOVE FROM WISHLIST
const removeFromWishlistController = async (req, res) => {
  try {
    const userId = req.user.id;
    const productId = req.params.productId;

    const result = await removeFromWishlist({ userId, productId });

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
  toggleWishlistController,
  getUserWishlistController,
  removeFromWishlistController,
};
