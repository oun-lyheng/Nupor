const {
  checkoutFromCart,
  uploadPaymentReceipt,
  confirmPaymentBySeller,
  rejectPaymentBySeller,
  getBuyerOrders,
  getOrderById,
  getSellerOrders,
  updateOrderStatus,
} = require("./Order.service");

// CHECKOUT FROM CART FOR A SPECIFIC SELLER
const checkoutController = async (req, res) => {
  try {
    const buyerId = req.user.id;
    const {
      sellerId,
      shippingAddress,
      receiverName,
      phoneNumber,
      paymentMethod,
      remark,
    } = req.body;

    const result = await checkoutFromCart({
      buyerId,
      sellerId,
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

// UPLOAD PAYMENT RECEIPT (BUYER)
const uploadPaymentReceiptController = async (req, res) => {
  try {
    const orderId = req.params.id;
    const buyerId = req.user.id;

    if (!req.file || !req.file.buffer) {
      return res.status(400).json({
        message: "Please select an image file to upload as payment receipt!",
      });
    }

    const result = await uploadPaymentReceipt({
      orderId,
      buyerId,
      fileBuffer: req.file.buffer,
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

// CONFIRM PAYMENT (SELLER)
const confirmPaymentController = async (req, res) => {
  try {
    const orderId = req.params.id;
    const sellerId = req.user.id;

    const result = await confirmPaymentBySeller({ orderId, sellerId });

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

// REJECT PAYMENT (SELLER)
const rejectPaymentController = async (req, res) => {
  try {
    const orderId = req.params.id;
    const sellerId = req.user.id;
    const { reason } = req.body;

    const result = await rejectPaymentBySeller({ orderId, sellerId, reason });

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

// GET SELLER'S ORDERS (SHOP DASHBOARD)
const getSellerOrdersController = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const result = await getSellerOrders(sellerId);

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

// UPDATE ORDER STATUS (e.g., cancelled or completed)
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
  uploadPaymentReceiptController,
  confirmPaymentController,
  rejectPaymentController,
  getBuyerOrdersController,
  getOrderByIdController,
  getSellerOrdersController,
  updateOrderStatusController,
};
