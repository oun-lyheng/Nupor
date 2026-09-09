const {
  getBuyerCart,
  addProductToCart,
  updateCartItemQuantity,
  removeProductFromCart,
  clearCart,
} = require("./Cart.service");

// GET CART
const getBuyerCartController = async (req, res) => {
  try {
    const buyerId = req.user.id;
    const result = await getBuyerCart(buyerId);

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

// ADD PRODUCT TO CART
const addProductToCartController = async (req, res) => {
  try {
    const { productId, qty } = req.body;
    const buyerId = req.user.id;

    const result = await addProductToCart({ buyerId, productId, qty });

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

// UPDATE / DECREASE QUANTITY
const updateCartItemQuantityController = async (req, res) => {
  try {
    const productId = req.params.productId || req.body.productId;
    const { qty } = req.body;
    const buyerId = req.user.id;

    const result = await updateCartItemQuantity({ buyerId, productId, qty });

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

// REMOVE PRODUCT FROM CART
const removeProductFromCartController = async (req, res) => {
  try {
    const productId = req.params.productId || req.body.productId;
    const buyerId = req.user.id;

    const result = await removeProductFromCart({ buyerId, productId });

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

// CLEAR ENTIRE CART
const clearCartController = async (req, res) => {
  try {
    const buyerId = req.user.id;

    const result = await clearCart(buyerId);

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
  getBuyerCartController,
  addProductToCartController,
  updateCartItemQuantityController,
  removeProductFromCartController,
  clearCartController,
};
