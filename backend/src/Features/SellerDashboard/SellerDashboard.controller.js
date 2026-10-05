const {
  getOverviewStats,
  getTopSellingProducts,
  getRecentOrders,
  getDailySalesChart,
} = require("./SellerDashboard.service");

// GET OVERVIEW STATS
const getOverviewStatsController = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const result = await getOverviewStats(sellerId);

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

// GET TOP SELLING PRODUCTS
const getTopSellingProductsController = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { limit } = req.query;

    const result = await getTopSellingProducts({ sellerId, limit });

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

// GET RECENT ORDERS
const getRecentOrdersController = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { limit } = req.query;

    const result = await getRecentOrders({ sellerId, limit });

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

// GET DAILY SALES CHART
const getDailySalesChartController = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { days } = req.query;

    const result = await getDailySalesChart({ sellerId, days });

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
  getOverviewStatsController,
  getTopSellingProductsController,
  getRecentOrdersController,
  getDailySalesChartController,
};
