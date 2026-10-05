const {
  getPlatformOverview,
  getUsersList,
  toggleUserBlock,
  getAllProductsAdmin,
  updateProductStatus,
  getAllOrdersAdmin,
  getAdminNotifications,
  markAdminNotificationAsRead,
  markAllAdminNotificationsAsRead,
} = require("./Admin.service");

// GET PLATFORM OVERVIEW
const getPlatformOverviewController = async (req, res) => {
  try {
    const result = await getPlatformOverview();

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

// GET USERS LIST
const getUsersListController = async (req, res) => {
  try {
    const { search, role, isSeller, isBlocked, page, limit } = req.query;

    const result = await getUsersList({
      search,
      role,
      isSeller,
      isBlocked,
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

// TOGGLE USER BLOCK
const toggleUserBlockController = async (req, res) => {
  try {
    const adminId = req.user.id;
    const targetUserId = req.params.id;
    const { isBlocked } = req.body;

    const result = await toggleUserBlock({
      adminId,
      targetUserId,
      isBlocked,
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

// GET PRODUCTS ADMIN
const getAllProductsAdminController = async (req, res) => {
  try {
    const { search, isActive, sellerId, page, limit } = req.query;

    const result = await getAllProductsAdmin({
      search,
      isActive,
      sellerId,
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

// UPDATE PRODUCT STATUS (BAN / UNBAN PRODUCT)
const updateProductStatusController = async (req, res) => {
  try {
    const productId = req.params.id;
    const { isActive } = req.body;

    if (isActive === undefined) {
      return res.status(400).json({
        message: "isActive (boolean) field is required",
      });
    }

    const result = await updateProductStatus({
      productId,
      isActive,
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

// GET ORDERS ADMIN
const getAllOrdersAdminController = async (req, res) => {
  try {
    const { status, search, page, limit } = req.query;

    const result = await getAllOrdersAdmin({
      status,
      search,
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

// GET ADMIN NOTIFICATIONS
const getAdminNotificationsController = async (req, res) => {
  try {
    const { page, limit, type, isRead } = req.query;

    const result = await getAdminNotifications({
      page,
      limit,
      type,
      isRead,
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

// MARK NOTIFICATION AS READ
const markAdminNotificationAsReadController = async (req, res) => {
  try {
    const notificationId = req.params.id;

    const result = await markAdminNotificationAsRead({
      notificationId,
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

// MARK ALL NOTIFICATIONS AS READ
const markAllAdminNotificationsAsReadController = async (req, res) => {
  try {
    const result = await markAllAdminNotificationsAsRead();

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
  getPlatformOverviewController,
  getUsersListController,
  toggleUserBlockController,
  getAllProductsAdminController,
  updateProductStatusController,
  getAllOrdersAdminController,
  getAdminNotificationsController,
  markAdminNotificationAsReadController,
  markAllAdminNotificationsAsReadController,
};
