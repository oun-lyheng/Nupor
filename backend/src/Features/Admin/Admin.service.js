const { Op, fn, col } = require("sequelize");
const db = require("../../models");
const { users, user_profiles, products, productImages, categories, orders, orderItems, payments, reviews, admin_notifications } = db;

// PLATFORM OVERVIEW (METRICS & KPI)
const getPlatformOverview = async () => {
  const totalUsers = await users.count();
  const totalSellers = await users.count({ where: { isSeller: true } });
  const totalBuyers = await users.count({ where: { isSeller: false } });
  const blockedUsers = await users.count({ where: { isBlocked: true } });

  const totalProducts = await products.count();
  const activeProducts = await products.count({ where: { isActive: true } });
  const inactiveProducts = await products.count({ where: { isActive: false } });

  const totalOrders = await orders.count();
  const completedOrders = await orders.count({ where: { orderStatus: "completed" } });
  const pendingOrders = await orders.count({ where: { orderStatus: "pending" } });
  const processingOrders = await orders.count({ where: { orderStatus: "processing" } });
  const cancelledOrders = await orders.count({ where: { orderStatus: "cancelled" } });

  const grossMerchandiseVolume = (await orders.sum("totalAmount", {
    where: { orderStatus: "completed" },
  })) || 0;

  const totalReviews = await reviews.count();

  return {
    message: "Platform overview fetched successfully",
    data: {
      users: {
        total: totalUsers,
        sellers: totalSellers,
        buyers: totalBuyers,
        blocked: blockedUsers,
      },
      products: {
        total: totalProducts,
        active: activeProducts,
        inactive: inactiveProducts,
      },
      orders: {
        total: totalOrders,
        completed: completedOrders,
        pending: pendingOrders,
        processing: processingOrders,
        cancelled: cancelledOrders,
      },
      financials: {
        gmv: parseFloat(Number(grossMerchandiseVolume).toFixed(2)),
        currency: "USD",
      },
      reviews: {
        total: totalReviews,
      },
    },
  };
};

// GET USERS LIST (WITH SEARCH & FILTERS)
const getUsersList = async ({
  search,
  role,
  isSeller,
  isBlocked,
  page = 1,
  limit = 10,
}) => {
  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.max(1, parseInt(limit, 10) || 10);
  const offset = (parsedPage - 1) * parsedLimit;

  const whereClause = {};

  if (role) {
    whereClause.role = role;
  }
  if (isSeller !== undefined && isSeller !== "") {
    whereClause.isSeller = isSeller === "true" || isSeller === true;
  }
  if (isBlocked !== undefined && isBlocked !== "") {
    whereClause.isBlocked = isBlocked === "true" || isBlocked === true;
  }

  if (search) {
    whereClause[Op.or] = [
      { fullName: { [Op.iLike]: `%${search}%` } },
      { userName: { [Op.iLike]: `%${search}%` } },
      { email: { [Op.iLike]: `%${search}%` } },
      { phoneNumber: { [Op.iLike]: `%${search}%` } },
    ];
  }

  const { rows, count } = await users.findAndCountAll({
    where: whereClause,
    attributes: { exclude: ["password"] },
    include: [
      {
        model: user_profiles,
        as: "profile",
      },
    ],
    order: [["createdAt", "DESC"]],
    limit: parsedLimit,
    offset,
  });

  return {
    message: "Users fetched successfully",
    data: {
      users: rows,
      pagination: {
        totalCount: count,
        totalPages: Math.ceil(count / parsedLimit),
        currentPage: parsedPage,
        limit: parsedLimit,
      },
    },
  };
};

// TOGGLE USER BLOCK STATUS
const toggleUserBlock = async ({ adminId, targetUserId, isBlocked }) => {
  if (parseInt(adminId, 10) === parseInt(targetUserId, 10)) {
    const error = new Error("Admins cannot modify their own block status");
    error.status = 400;
    throw error;
  }

  const targetUser = await users.findByPk(targetUserId, {
    attributes: { exclude: ["password"] },
  });

  if (!targetUser) {
    const error = new Error("User not found");
    error.status = 404;
    throw error;
  }

  const newStatus = isBlocked !== undefined ? Boolean(isBlocked) : !targetUser.isBlocked;
  await targetUser.update({ isBlocked: newStatus });

  return {
    message: `User successfully ${newStatus ? "blocked" : "unblocked"}`,
    data: targetUser,
  };
};

// GET ALL PRODUCTS FOR MODERATION
const getAllProductsAdmin = async ({
  search,
  isActive,
  sellerId,
  page = 1,
  limit = 10,
}) => {
  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.max(1, parseInt(limit, 10) || 10);
  const offset = (parsedPage - 1) * parsedLimit;

  const whereClause = {};

  if (isActive !== undefined && isActive !== "") {
    whereClause.isActive = isActive === "true" || isActive === true;
  }
  if (sellerId) {
    whereClause.userId = sellerId;
  }
  if (search) {
    whereClause[Op.or] = [
      { productName: { [Op.iLike]: `%${search}%` } },
      { slug: { [Op.iLike]: `%${search}%` } },
    ];
  }

  const { rows, count } = await products.findAndCountAll({
    where: whereClause,
    include: [
      {
        model: users,
        as: "seller",
        attributes: ["id", "fullName", "userName", "email", "phoneNumber"],
      },
      {
        model: productImages,
        as: "images",
        attributes: ["id", "productImageUrl", "position"],
      },
      {
        model: categories,
        as: "categories",
        through: { attributes: [] },
      },
    ],
    order: [["createdAt", "DESC"]],
    limit: parsedLimit,
    offset,
    distinct: true,
  });

  return {
    message: "Admin products fetched successfully",
    data: {
      products: rows,
      pagination: {
        totalCount: count,
        totalPages: Math.ceil(count / parsedLimit),
        currentPage: parsedPage,
        limit: parsedLimit,
      },
    },
  };
};

// UPDATE PRODUCT ACTIVE STATUS (MODERATION BAN / UNBAN)
const updateProductStatus = async ({ productId, isActive }) => {
  const product = await products.findByPk(productId);

  if (!product) {
    const error = new Error("Product not found");
    error.status = 404;
    throw error;
  }

  const statusToSet = Boolean(isActive);
  await product.update({ isActive: statusToSet });

  return {
    message: `Product successfully ${statusToSet ? "activated" : "hidden/deactivated"}`,
    data: product,
  };
};

// GET ALL ORDERS FOR ADMIN
const getAllOrdersAdmin = async ({
  status,
  search,
  page = 1,
  limit = 10,
}) => {
  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.max(1, parseInt(limit, 10) || 10);
  const offset = (parsedPage - 1) * parsedLimit;

  const whereClause = {};

  if (status) {
    whereClause.orderStatus = status;
  }
  if (search) {
    whereClause[Op.or] = [
      { orderNumber: { [Op.iLike]: `%${search}%` } },
      { receiverName: { [Op.iLike]: `%${search}%` } },
      { phoneNumber: { [Op.iLike]: `%${search}%` } },
    ];
  }

  const { rows, count } = await orders.findAndCountAll({
    where: whereClause,
    include: [
      {
        model: users,
        as: "buyer",
        attributes: ["id", "fullName", "userName", "email", "phoneNumber"],
      },
      {
        model: users,
        as: "seller",
        attributes: ["id", "fullName", "userName", "email", "phoneNumber"],
      },
      {
        model: orderItems,
        as: "items",
      },
      {
        model: payments,
        as: "payment",
      },
    ],
    order: [["createdAt", "DESC"]],
    limit: parsedLimit,
    offset,
    distinct: true,
  });

  return {
    message: "Admin orders fetched successfully",
    data: {
      orders: rows,
      pagination: {
        totalCount: count,
        totalPages: Math.ceil(count / parsedLimit),
        currentPage: parsedPage,
        limit: parsedLimit,
      },
    },
  };
};

// GET ADMIN NOTIFICATIONS (WITH PAGINATION AND FILTER)
const getAdminNotifications = async ({ page = 1, limit = 10, type, isRead } = {}) => {
  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
  const offset = (parsedPage - 1) * parsedLimit;

  const where = {};
  if (type) {
    where.type = type;
  }
  if (isRead !== undefined && isRead !== null && isRead !== "") {
    where.isRead = isRead === "true" || isRead === true;
  }

  const { count, rows } = await admin_notifications.findAndCountAll({
    where,
    order: [["createdAt", "DESC"]],
    limit: parsedLimit,
    offset,
  });

  const unreadCount = await admin_notifications.count({
    where: { isRead: false },
  });

  return {
    message: "Admin notifications fetched successfully",
    data: {
      notifications: rows,
      unreadCount,
      pagination: {
        totalCount: count,
        totalPages: Math.ceil(count / parsedLimit),
        currentPage: parsedPage,
        limit: parsedLimit,
      },
    },
  };
};

// MARK NOTIFICATION AS READ
const markAdminNotificationAsRead = async ({ notificationId }) => {
  const targetId = parseInt(notificationId, 10);
  const notification = await admin_notifications.findByPk(targetId);

  if (!notification) {
    const err = new Error("Notification not found");
    err.status = 404;
    throw err;
  }

  if (!notification.isRead) {
    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();
  }

  return {
    message: "Notification marked as read successfully",
    data: notification,
  };
};

// MARK ALL NOTIFICATIONS AS READ
const markAllAdminNotificationsAsRead = async () => {
  const now = new Date();
  const [updatedCount] = await admin_notifications.update(
    { isRead: true, readAt: now },
    { where: { isRead: false } }
  );

  return {
    message: "All notifications marked as read successfully",
    data: {
      updatedCount,
    },
  };
};

module.exports = {
  getPlatformOverview,
  getUsersList,
  toggleUserBlock,
  getAllProductsAdmin,
  updateProductStatus,
  getAllOrdersAdmin,
  getAdminNotifications,
  markAdminNotificationAsRead,
  markAllAdminNotificationsAsRead,
};
