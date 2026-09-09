const {
  orders,
  orderItems,
  payments,
  cart,
  cartItems,
  products,
  productImages,
  users,
  sequelize,
} = require("../../models");
const { throwError } = require("../../utils/appError");


/**
 * Helper to get full order details by ID
 */
const getFullOrderData = async (orderId, transaction = null) => {
  return await orders.findOne({
    where: { id: orderId },
    include: [
      {
        model: users,
        as: "buyer",
        attributes: ["id", "fullName", "userName", "email", "phoneNumber"],
      },
      {
        model: orderItems,
        as: "items",
        include: [
          {
            model: users,
            as: "seller",
            attributes: ["id", "fullName", "userName", "phoneNumber"],
          },
        ],
      },
      {
        model: payments,
        as: "payment",
      },
    ],
    transaction,
  });
};

/**
 * CHECKOUT FROM BUYER'S CART
 * Runs in an atomic transaction:
 * 1. Validate cart has items
 * 2. Check stock for each product
 * 3. Snapshot prices, names, images, sellers
 * 4. Deduct product stocks
 * 5. Create order and orderItems
 * 6. Create payment record
 * 7. Clear buyer's cart items
 */
const checkoutFromCart = async ({
  buyerId,
  shippingAddress,
  receiverName,
  phoneNumber,
  paymentMethod = "cod",
  remark = null,
}) => {
  if (!shippingAddress || !receiverName || !phoneNumber) {
    throwError("Please provide shippingAddress, receiverName, and phoneNumber!", 400);
  }

  return await sequelize.transaction(async (t) => {
    // 1. Fetch user's cart
    const userCart = await cart.findOne({
      where: { buyerId },
      include: [
        {
          model: cartItems,
          as: "items",
          include: [
            {
              model: products,
              as: "product",
              include: [{ model: productImages, as: "images" }],
            },
          ],
        },
      ],
      transaction: t,
    });

    if (!userCart || !userCart.items || userCart.items.length === 0) {
      throwError("Your cart is empty! Add products before checkout.", 400);
    }

    // 2. Validate stock and calculate total
    let totalAmount = 0;
    const itemsToCreate = [];

    for (const item of userCart.items) {
      const prod = item.product;

      if (!prod || !prod.isActive) {
        throwError(
          `Product "${prod ? prod.productName : "Unknown"}" is no longer available!`,
          400
        );
      }

      if (prod.stock < item.qty) {
        throwError(
          `Insufficient stock for "${prod.productName}". Only ${prod.stock} items left in stock.`,
          400
        );
      }

      const unitPrice = parseFloat(prod.price);
      const subTotal = parseFloat((unitPrice * item.qty).toFixed(2));
      totalAmount += subTotal;

      // Pick main image (position 1 or first image)
      let mainImageUrl = null;
      if (prod.images && prod.images.length > 0) {
        const sortedImgs = [...prod.images].sort(
          (a, b) => (a.position || 99) - (b.position || 99)
        );
        mainImageUrl = sortedImgs[0].imageUrl;
      }

      itemsToCreate.push({
        productId: prod.id,
        sellerId: prod.userId,
        productName: prod.productName,
        productImage: mainImageUrl,
        unitPrice,
        qty: item.qty,
        subTotal,
      });
    }

    totalAmount = parseFloat(totalAmount.toFixed(2));

    // 3. Create the Order
    const newOrder = await orders.create(
      {
        buyerId,
        orderNumber: `ORD-${Date.now()}`,
        orderStatus: "pending",
        totalAmount,
        shippingAddress,
        receiverName,
        phoneNumber,
      },
      { transaction: t }
    );

    // 4. Create OrderItems linked to newOrder
    const orderItemsWithOrderId = itemsToCreate.map((item) => ({
      ...item,
      orderId: newOrder.id,
    }));
    await orderItems.bulkCreate(orderItemsWithOrderId, { transaction: t });

    // 5. Decrement Stock for all products
    for (const item of userCart.items) {
      await products.decrement("stock", {
        by: item.qty,
        where: { id: item.productId },
        transaction: t,
      });
    }

    // 6. Create Payment Record
    await payments.create(
      {
        orderId: newOrder.id,
        amount: totalAmount,
        status: "pending",
        paymentMethod,
        remark,
      },
      { transaction: t }
    );

    // 7. Clear buyer's cart items
    await cartItems.destroy({
      where: { cartId: userCart.id },
      transaction: t,
    });

    // 8. Fetch complete created order
    const completedOrder = await getFullOrderData(newOrder.id, t);

    return {
      message: "Order placed successfully!",
      data: completedOrder,
    };
  });
};

/**
 * GET ALL ORDERS FOR A BUYER
 */
const getBuyerOrders = async (buyerId) => {
  const userOrders = await orders.findAll({
    where: { buyerId },
    include: [
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
  });

  return {
    message: "Orders retrieved successfully",
    data: userOrders,
  };
};

/**
 * GET SINGLE ORDER DETAIL (Buyer, Seller of items, or Admin)
 */
const getOrderById = async ({ orderId, userId, role }) => {
  const order = await getFullOrderData(orderId);

  if (!order) {
    throwError("Order not found!", 404);
  }

  // Authorization check: Buyer, Admin, or Seller who has items in this order
  const isBuyer = order.buyerId === userId;
  const isAdmin = role === "admin";
  const isSellerOfItem = order.items.some((item) => item.sellerId === userId);

  if (!isBuyer && !isAdmin && !isSellerOfItem) {
    throwError("You are not authorized to view this order!", 403);
  }

  return {
    message: "Order details retrieved successfully",
    data: order,
  };
};

/**
 * GET ORDERS CONTAINING ITEMS SOLD BY A SPECIFIC SELLER
 */
const getSellerSoldItems = async (sellerId) => {
  const soldItems = await orderItems.findAll({
    where: { sellerId },
    include: [
      {
        model: orders,
        as: "order",
        include: [
          {
            model: users,
            as: "buyer",
            attributes: ["id", "fullName", "userName", "phoneNumber"],
          },
          {
            model: payments,
            as: "payment",
            attributes: ["status", "paymentMethod"],
          },
        ],
      },
    ],
    order: [["createdAt", "DESC"]],
  });

  return {
    message: "Sold items retrieved successfully",
    data: soldItems,
  };
};

/**
 * UPDATE ORDER STATUS (e.g. pending -> processing -> completed or cancelled)
 * If cancelled, restore stock!
 */
const updateOrderStatus = async ({ orderId, status, userId, role }) => {
  const allowedStatuses = ["pending", "processing", "completed", "cancelled"];
  if (!allowedStatuses.includes(status)) {
    throwError(
      `Invalid status. Allowed values: ${allowedStatuses.join(", ")}`,
      400
    );
  }

  return await sequelize.transaction(async (t) => {
    const order = await orders.findOne({
      where: { id: orderId },
      include: [{ model: orderItems, as: "items" }],
      transaction: t,
    });

    if (!order) {
      throwError("Order not found!", 404);
    }

    const isBuyer = order.buyerId === userId;
    const isAdmin = role === "admin";
    const isSeller = order.items.some((item) => item.sellerId === userId);

    // Buyers can only cancel if still pending
    if (isBuyer && !isAdmin && !isSeller) {
      if (status !== "cancelled") {
        throwError("Buyers can only cancel their orders!", 403);
      }
      if (order.orderStatus !== "pending") {
        throwError("Cannot cancel an order that is already processing or completed!", 400);
      }
    }

    // If order was not cancelled, but is now being cancelled -> restore inventory stock
    if (status === "cancelled" && order.orderStatus !== "cancelled") {
      for (const item of order.items) {
        if (item.productId) {
          await products.increment("stock", {
            by: item.qty,
            where: { id: item.productId },
            transaction: t,
          });
        }
      }
    }

    order.orderStatus = status;
    await order.save({ transaction: t });

    const updatedOrder = await getFullOrderData(order.id, t);

    return {
      message: `Order status updated to ${status} successfully`,
      data: updatedOrder,
    };
  });
};

module.exports = {
  checkoutFromCart,
  getBuyerOrders,
  getOrderById,
  getSellerSoldItems,
  updateOrderStatus,
};
