const {
  checkoutFromCart,
  getBuyerOrders,
  getOrderById,
  getSellerSoldItems,
  updateOrderStatus,
} = require("./Order.service");

// CHECKOUT FROM CART
const checkoutController = async (req, res) => {
  try {
    const buyerId = req.user.id;
    const {
      shippingAddress,
      receiverName,
      phoneNumber,
      paymentMethod,
      remark,
    } = req.body;

    const result = await checkoutFromCart({
      buyerId,
      shippingAddress,
      receiverName,
      phoneNumber,
      paymentMethod,
      remark,
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

// GET BUYER'S ORDERS
const getBuyerOrdersController = async (req, res) => {
  try {
    const buyerId = req.user.id;
    const result = await getBuyerOrders(buyerId);

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

// GET ORDER BY ID
const getOrderByIdController = async (req, res) => {
  try {
    const orderId = req.params.id;
    const userId = req.user.id;
    const role = req.user.role;

    const result = await getOrderById({ orderId, userId, role });

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

// GET SELLER'S SOLD ITEMS
const getSellerSoldItemsController = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const result = await getSellerSoldItems(sellerId);

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

// UPDATE ORDER STATUS
const updateOrderStatusController = async (req, res) => {
  try {
    const orderId = req.params.id;
    const { status } = req.body;
    const userId = req.user.id;
    const role = req.user.role;

    const result = await updateOrderStatus({
      orderId,
      status,
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

module.exports = {
  checkoutController,
  getBuyerOrdersController,
  getOrderByIdController,
  getSellerSoldItemsController,
  updateOrderStatusController,
};
