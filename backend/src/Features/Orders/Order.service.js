const {
  orders,
  orderItems,
  payments,
  cart,
  cartItems,
  products,
  productImages,
  product_variants,
  users,
  user_profiles,
  sequelize,
} = require("../../models");
const { throwError } = require("../../utils/appError");
const { uploadBufferImageToCloudinary } = require("../../utils/uploadImage");

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
        model: users,
        as: "seller",
        attributes: ["id", "fullName", "userName", "phoneNumber"],
        include: [
          {
            model: user_profiles,
            as: "profile",
            attributes: [
              "profile_url",
              "accountName",
              "accountNumber",
              "khqrUrl",
              "telegramUsername",
            ],
          },
        ],
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
    transaction,
  });
};

/**
 * Helper to build pre-formatted Telegram chat data & link
 */
const generateOrderTelegramChatInfo = (order) => {
  const seller = order.seller;
  const rawTelegramUsername = seller?.profile?.telegramUsername;
  const sellerTelegramUsername = rawTelegramUsername
    ? rawTelegramUsername.replace(/^@+/, "").trim()
    : null;

  let itemsText = "";
  if (order.items && order.items.length > 0) {
    itemsText = order.items
      .map(
        (item, idx) => {
          const displayName = item.variantName
            ? `${item.productName} (${item.variantName})`
            : item.productName;
          return `  ${idx + 1}. ${displayName} (x${item.qty}) — $${parseFloat(item.subTotal).toFixed(2)}`;
        }
      )
      .join("\n");
  }

  const orderSummaryText = [
    `🛍️ *Nupor Order #${order.orderNumber}*`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `📦 *Products Ordered:*`,
    itemsText || "  (No items)",
    `━━━━━━━━━━━━━━━━━━━━`,
    `💰 *Total Amount:* $${parseFloat(order.totalAmount).toFixed(2)}`,
    `👤 *Buyer:* ${order.receiverName || order.buyer?.fullName || "Customer"}`,
    `📞 *Phone:* ${order.phoneNumber || order.buyer?.phoneNumber || "N/A"}`,
    `📍 *Deliver to:* ${order.shippingAddress || "N/A"}`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `Hello! I just placed this order on Nupor Marketplace. Please confirm availability and delivery details. Thank you! 🙏`,
  ].join("\n");

  const telegramChatUrl = sellerTelegramUsername
    ? `https://t.me/${sellerTelegramUsername}?text=${encodeURIComponent(orderSummaryText)}`
    : null;

  return {
    sellerTelegramUsername,
    orderSummaryText,
    telegramChatUrl,
  };
};

/**
 * CHECKOUT FROM BUYER'S CART FOR A SPECIFIC SELLER (Shopee Style)
 * Atomic transaction:
 * 1. Validate cart has items for the specified sellerId
 * 2. Check stock for each product of this seller
 * 3. Snapshot prices, names, main images, and sellerId
 * 4. Deduct product stocks
 * 5. Create order with buyerId AND sellerId
 * 6. Create orderItems linked to this order
 * 7. Create payment record (status: 'pending')
 * 8. Remove ONLY this seller's items from cartItems
 * 9. Return completed order + seller's KHQR payment info
 */
const checkoutFromCart = async ({
  buyerId,
  sellerId,
  shippingAddress,
  receiverName,
  phoneNumber,
  paymentMethod = "khqr",
  remark = null,
}) => {
  if (!sellerId) {
    throwError("Please specify the sellerId to checkout for that shop!", 400);
  }

  if (!shippingAddress || !receiverName || !phoneNumber) {
    throwError(
      "Please provide shippingAddress, receiverName, and phoneNumber!",
      400
    );
  }

  const targetSellerId = parseInt(sellerId, 10);

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
            {
              model: product_variants,
              as: "variant",
            },
          ],
        },
      ],
      transaction: t,
    });

    if (!userCart || !userCart.items || userCart.items.length === 0) {
      throwError("Your cart is empty! Add products before checkout.", 400);
    }

    // 2. Filter items belonging ONLY to the requested seller
    const sellerItems = userCart.items.filter(
      (item) => item.product && item.product.userId === targetSellerId
    );

    if (sellerItems.length === 0) {
      throwError("No items from this seller were found in your cart!", 404);
    }

    // 3. Validate stock and calculate total for this seller's items
    let totalAmount = 0;
    const itemsToCreate = [];
    const itemIdsToRemove = [];

    for (const item of sellerItems) {
      const prod = item.product;
      const variant = item.variant;

      if (!prod.isActive) {
        throwError(
          `Product "${prod.productName}" is no longer available!`,
          400
        );
      }

      if (variant && !variant.isActive) {
        throwError(
          `Variant "${variant.variantName}" of "${prod.productName}" is no longer available!`,
          400
        );
      }

      // Check stock against variant or product
      const availableStock = variant ? variant.stock : prod.stock;
      const itemTitle = variant
        ? `${prod.productName} (${variant.variantName})`
        : prod.productName;

      if (availableStock < item.qty) {
        throwError(
          `Insufficient stock for "${itemTitle}". Only ${availableStock} left in stock.`,
          400
        );
      }

      const unitPrice = variant ? parseFloat(variant.price) : parseFloat(prod.price);
      const subTotal = parseFloat((unitPrice * item.qty).toFixed(2));
      totalAmount += subTotal;

      // Pick main image (variant imageUrl or product position 1 image)
      let mainImageUrl = variant?.imageUrl || null;
      if (!mainImageUrl && prod.images && prod.images.length > 0) {
        const sortedImgs = [...prod.images].sort(
          (a, b) => (a.position || 99) - (b.position || 99)
        );
        mainImageUrl = sortedImgs[0].imageUrl;
      }

      itemsToCreate.push({
        productId: prod.id,
        variantId: variant ? variant.id : null,
        variantName: variant ? variant.variantName : null,
        sellerId: targetSellerId,
        productName: prod.productName,
        productImage: mainImageUrl,
        unitPrice,
        qty: item.qty,
        subTotal,
      });

      itemIdsToRemove.push(item.id);
    }

    totalAmount = parseFloat(totalAmount.toFixed(2));

    // 4. Create the Order (with sellerId and buyerId)
    const newOrder = await orders.create(
      {
        buyerId,
        sellerId: targetSellerId,
        orderNumber: `ORD-${Date.now()}`,
        orderStatus: "pending",
        totalAmount,
        shippingAddress,
        receiverName,
        phoneNumber,
      },
      { transaction: t }
    );

    // 5. Create OrderItems linked to newOrder
    const orderItemsWithOrderId = itemsToCreate.map((item) => ({
      ...item,
      orderId: newOrder.id,
    }));
    await orderItems.bulkCreate(orderItemsWithOrderId, { transaction: t });

    // 6. Decrement Stock for this seller's products and variants
    for (const item of sellerItems) {
      if (item.variantId) {
        await product_variants.decrement("stock", {
          by: item.qty,
          where: { id: item.variantId },
          transaction: t,
        });
      }
      await products.decrement("stock", {
        by: item.qty,
        where: { id: item.productId },
        transaction: t,
      });
    }

    // 7. Create Payment Record (default pending)
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

    // 8. Clear ONLY this seller's items from cartItems
    await cartItems.destroy({
      where: { id: itemIdsToRemove },
      transaction: t,
    });

    // 9. Fetch complete created order
    const completedOrder = await getFullOrderData(newOrder.id, t);

    // 10. Fetch Seller Payment Info to return directly to the buyer
    const sellerProfile = await user_profiles.findOne({
      where: { userId: targetSellerId },
      attributes: ["accountName", "accountNumber", "khqrUrl", "telegramUsername"],
      transaction: t,
    });

    const telegramChat = generateOrderTelegramChatInfo(completedOrder);

    return {
      message: "Order placed successfully! Please scan the seller's KHQR or chat with the seller on Telegram.",
      data: {
        order: completedOrder,
        sellerPaymentInfo: {
          sellerId: targetSellerId,
          accountName: sellerProfile?.accountName,
          accountNumber: sellerProfile?.accountNumber,
          khqrUrl: sellerProfile?.khqrUrl,
          telegramUsername: sellerProfile?.telegramUsername,
          amountDue: totalAmount,
        },
        telegramChat,
      },
    };
  });
};

/**
 * UPLOAD PROOF OF PAYMENT RECEIPT (Buyer uploads transfer screenshot)
 */
const uploadPaymentReceipt = async ({ orderId, buyerId, fileBuffer }) => {
  if (!fileBuffer) {
    throwError("Please upload a payment receipt image!", 400);
  }

  const order = await orders.findOne({
    where: { id: orderId },
    include: [{ model: payments, as: "payment" }],
  });

  if (!order) {
    throwError("Order not found!", 404);
  }

  if (order.buyerId !== buyerId) {
    throwError("You are not authorized to upload receipt for this order!", 403);
  }

  if (order.orderStatus !== "pending" && order.orderStatus !== "payment_submitted") {
    throwError(
      `Cannot upload receipt for order with status "${order.orderStatus}"!`,
      400
    );
  }

  // Upload to Cloudinary
  const uploadResult = await uploadBufferImageToCloudinary(fileBuffer, {
    folder: "nupor/payment_receipts",
  });

  // Update payment record
  if (order.payment) {
    order.payment.receiptUrl = uploadResult.secure_url;
    order.payment.receiptPublicId = uploadResult.public_id;
    order.payment.status = "payment_submitted";
    order.payment.paidAt = new Date();
    await order.payment.save();
  } else {
    await payments.create({
      orderId: order.id,
      amount: order.totalAmount,
      status: "payment_submitted",
      receiptUrl: uploadResult.secure_url,
      receiptPublicId: uploadResult.public_id,
      paidAt: new Date(),
    });
  }

  // Update order status to payment_submitted
  order.orderStatus = "payment_submitted";
  await order.save();

  const updatedOrder = await getFullOrderData(order.id);

  return {
    message: "Payment receipt uploaded successfully! Waiting for seller confirmation.",
    data: updatedOrder,
  };
};

/**
 * CONFIRM PAYMENT (Seller reviews receipt and marks payment approved)
 */
const confirmPaymentBySeller = async ({ orderId, sellerId }) => {
  const order = await orders.findOne({
    where: { id: orderId },
    include: [{ model: payments, as: "payment" }],
  });

  if (!order) {
    throwError("Order not found!", 404);
  }

  if (order.sellerId !== sellerId) {
    throwError("Only the seller of this order can confirm payment!", 403);
  }

  if (!order.payment || !order.payment.receiptUrl) {
    throwError("Cannot confirm payment: Buyer has not uploaded a payment receipt yet!", 400);
  }

  // Update payment & order
  order.payment.status = "approved";
  await order.payment.save();

  order.orderStatus = "processing";
  await order.save();

  const updatedOrder = await getFullOrderData(order.id);

  return {
    message: "Payment confirmed successfully! Order is now processing.",
    data: updatedOrder,
  };
};

/**
 * REJECT PAYMENT (Seller rejects invalid/unmatched receipt)
 */
const rejectPaymentBySeller = async ({ orderId, sellerId, reason }) => {
  const order = await orders.findOne({
    where: { id: orderId },
    include: [{ model: payments, as: "payment" }],
  });

  if (!order) {
    throwError("Order not found!", 404);
  }

  if (order.sellerId !== sellerId) {
    throwError("Only the seller of this order can reject payment!", 403);
  }

  if (order.payment) {
    order.payment.status = "rejected";
    order.payment.remark = reason || "Payment receipt rejected by seller. Please re-upload.";
    await order.payment.save();
  }

  order.orderStatus = "pending";
  await order.save();

  const updatedOrder = await getFullOrderData(order.id);

  return {
    message: "Payment receipt rejected. Buyer will be requested to re-upload.",
    data: updatedOrder,
  };
};

/**
 * GET ALL ORDERS FOR A BUYER
 */
const getBuyerOrders = async (buyerId) => {
  const userOrders = await orders.findAll({
    where: { buyerId },
    include: [
      {
        model: users,
        as: "seller",
        attributes: ["id", "fullName", "userName", "phoneNumber"],
        include: [
          {
            model: user_profiles,
            as: "profile",
            attributes: ["profile_url", "accountName", "accountNumber", "khqrUrl"],
          },
        ],
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
  });

  return {
    message: "Orders retrieved successfully",
    data: userOrders,
  };
};

/**
 * GET SINGLE ORDER DETAIL (Buyer, Seller, or Admin)
 */
const getOrderById = async ({ orderId, userId, role }) => {
  const order = await getFullOrderData(orderId);

  if (!order) {
    throwError("Order not found!", 404);
  }

  const isBuyer = order.buyerId === userId;
  const isSeller = order.sellerId === userId;
  const isAdmin = role === "admin";

  if (!isBuyer && !isSeller && !isAdmin) {
    throwError("You are not authorized to view this order!", 403);
  }

  const telegramChat = generateOrderTelegramChatInfo(order);

  return {
    message: "Order details retrieved successfully",
    data: {
      ...order.toJSON(),
      telegramChat,
    },
  };
};

/**
 * GET ORDERS FOR A SPECIFIC SELLER (Seller's shop sales)
 */
const getSellerOrders = async (sellerId) => {
  const shopOrders = await orders.findAll({
    where: { sellerId },
    include: [
      {
        model: users,
        as: "buyer",
        attributes: ["id", "fullName", "userName", "phoneNumber"],
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
  });

  return {
    message: "Seller orders retrieved successfully",
    data: shopOrders,
  };
};

/**
 * UPDATE ORDER STATUS (e.g. processing -> completed or cancelled)
 * If cancelled, restore product stock!
 */
const updateOrderStatus = async ({ orderId, status, userId, role }) => {
  const allowedStatuses = [
    "pending",
    "payment_submitted",
    "processing",
    "completed",
    "cancelled",
  ];
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
    const isSeller = order.sellerId === userId;
    const isAdmin = role === "admin";

    // Buyers can only cancel if still pending or payment_submitted
    if (isBuyer && !isAdmin && !isSeller) {
      if (status !== "cancelled") {
        throwError("Buyers can only cancel their orders!", 403);
      }
      if (order.orderStatus !== "pending" && order.orderStatus !== "payment_submitted") {
        throwError(
          "Cannot cancel an order that is already processing or completed!",
          400
        );
      }
    }

    // Restore inventory stock if cancelled
    if (status === "cancelled" && order.orderStatus !== "cancelled") {
      for (const item of order.items) {
        if (item.variantId) {
          await product_variants.increment("stock", {
            by: item.qty,
            where: { id: item.variantId },
            transaction: t,
          });
        }
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
  uploadPaymentReceipt,
  confirmPaymentBySeller,
  rejectPaymentBySeller,
  getBuyerOrders,
  getOrderById,
  getSellerOrders,
  updateOrderStatus,
};
