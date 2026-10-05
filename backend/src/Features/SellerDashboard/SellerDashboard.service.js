const { Op, fn, col, literal } = require("sequelize");
const db = require("../../models");
const { orders, orderItems, products, users, payments } = db;

// GET OVERVIEW STATS FOR SELLER
const getOverviewStats = async (sellerId) => {
  // Order counts
  const totalOrders = await orders.count({ where: { sellerId } });
  const pendingOrders = await orders.count({ where: { sellerId, orderStatus: "pending" } });
  const processingOrders = await orders.count({ where: { sellerId, orderStatus: "processing" } });
  const completedOrders = await orders.count({ where: { sellerId, orderStatus: "completed" } });
  const cancelledOrders = await orders.count({ where: { sellerId, orderStatus: "cancelled" } });

  // Revenue metrics
  const totalRevenue = (await orders.sum("totalAmount", {
    where: { sellerId, orderStatus: "completed" },
  })) || 0;

  const pendingRevenue = (await orders.sum("totalAmount", {
    where: {
      sellerId,
      orderStatus: { [Op.in]: ["pending", "processing"] },
    },
  })) || 0;

  // Inventory metrics
  const totalProducts = await products.count({ where: { userId: sellerId } });
  const lowStockProducts = await products.count({
    where: {
      userId: sellerId,
      stock: { [Op.gt]: 0, [Op.lte]: 5 },
    },
  });
  const outOfStockProducts = await products.count({
    where: {
      userId: sellerId,
      stock: 0,
    },
  });

  // Shop average rating
  const ratingData = await products.findOne({
    attributes: [[fn("AVG", col("avgRating")), "avgShopRating"]],
    where: { userId: sellerId },
    raw: true,
  });
  const avgRating = ratingData?.avgShopRating
    ? parseFloat(parseFloat(ratingData.avgShopRating).toFixed(2))
    : 0;

  return {
    message: "Seller overview stats fetched successfully",
    data: {
      orders: {
        total: totalOrders,
        pending: pendingOrders,
        processing: processingOrders,
        completed: completedOrders,
        cancelled: cancelledOrders,
      },
      revenue: {
        total: parseFloat(Number(totalRevenue).toFixed(2)),
        pending: parseFloat(Number(pendingRevenue).toFixed(2)),
        currency: "USD",
      },
      inventory: {
        totalProducts,
        lowStock: lowStockProducts,
        outOfStock: outOfStockProducts,
      },
      rating: {
        avgRating,
      },
    },
  };
};

// GET TOP SELLING PRODUCTS FOR SELLER
const getTopSellingProducts = async ({ sellerId, limit = 5 }) => {
  const parsedLimit = Math.max(1, parseInt(limit, 10) || 5);

  const topItems = await orderItems.findAll({
    attributes: [
      "productId",
      "productName",
      "productImage",
      [fn("SUM", col("qty")), "totalSold"],
      [fn("SUM", col("subTotal")), "totalRevenue"],
    ],
    where: { sellerId },
    include: [
      {
        model: orders,
        as: "order",
        attributes: [],
        where: {
          orderStatus: { [Op.ne]: "cancelled" },
        },
      },
    ],
    group: ["orderItems.productId", "orderItems.productName", "orderItems.productImage"],
    order: [[literal('"totalSold"'), "DESC"]],
    limit: parsedLimit,
    raw: true,
  });

  const formattedItems = topItems.map((item) => ({
    productId: item.productId,
    productName: item.productName,
    productImage: item.productImage,
    totalSold: parseInt(item.totalSold, 10) || 0,
    totalRevenue: parseFloat(Number(item.totalRevenue || 0).toFixed(2)),
  }));

  return {
    message: "Top selling products fetched successfully",
    data: formattedItems,
  };
};

// GET RECENT ORDERS FOR SELLER
const getRecentOrders = async ({ sellerId, limit = 10 }) => {
  const parsedLimit = Math.max(1, parseInt(limit, 10) || 10);

  const recentOrders = await orders.findAll({
    where: { sellerId },
    include: [
      {
        model: users,
        as: "buyer",
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
  });

  return {
    message: "Recent orders fetched successfully",
    data: recentOrders,
  };
};

// GET SALES CHART (DAILY BREAKDOWN)
const getDailySalesChart = async ({ sellerId, days = 7 }) => {
  const parsedDays = Math.max(1, parseInt(days, 10) || 7);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - (parsedDays - 1));
  startDate.setHours(0, 0, 0, 0);

  const completedOrders = await orders.findAll({
    attributes: ["createdAt", "totalAmount"],
    where: {
      sellerId,
      orderStatus: "completed",
      createdAt: { [Op.gte]: startDate },
    },
    order: [["createdAt", "ASC"]],
    raw: true,
  });

  // Group by Date string (YYYY-MM-DD)
  const dateMap = {};
  for (let i = 0; i < parsedDays; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    const dateKey = d.toISOString().split("T")[0];
    dateMap[dateKey] = { date: dateKey, orderCount: 0, revenue: 0 };
  }

  completedOrders.forEach((order) => {
    const dateKey = new Date(order.createdAt).toISOString().split("T")[0];
    if (dateMap[dateKey]) {
      dateMap[dateKey].orderCount += 1;
      dateMap[dateKey].revenue += Number(order.totalAmount);
    }
  });

  const chartData = Object.values(dateMap).map((entry) => ({
    date: entry.date,
    orderCount: entry.orderCount,
    revenue: parseFloat(entry.revenue.toFixed(2)),
  }));

  return {
    message: `Sales chart for past ${parsedDays} days fetched successfully`,
    data: chartData,
  };
};

module.exports = {
  getOverviewStats,
  getTopSellingProducts,
  getRecentOrders,
  getDailySalesChart,
};
