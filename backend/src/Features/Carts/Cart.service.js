const { cart, cartItems, products, productImages } = require("../../models");
const { throwError } = require("../../utils/appError");

/**
 * Helper to get or create buyer's active cart
 */
const getOrCreateCart = async (buyerId) => {
  let userCart = await cart.findOne({ where: { buyerId } });
  if (!userCart) {
    userCart = await cart.create({ buyerId });
  }
  return userCart;
};

/**
 * Helper to fetch full cart with product details, calculated subtotals, and grand total
 */
const getFullCartData = async (cartId) => {
  const fullCart = await cart.findOne({
    where: { id: cartId },
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
    order: [[{ model: cartItems, as: "items" }, "createdAt", "DESC"]],
  });

  if (!fullCart) return null;

  // Calculate totals
  let grandTotal = 0;
  let totalItems = 0;

  const itemsWithSubtotal = fullCart.items.map((item) => {
    const unitPrice = parseFloat(item.product?.price || 0);
    const subtotal = unitPrice * item.qty;
    grandTotal += subtotal;
    totalItems += item.qty;

    return {
      ...item.toJSON(),
      subtotal: parseFloat(subtotal.toFixed(2)),
    };
  });

  return {
    id: fullCart.id,
    buyerId: fullCart.buyerId,
    totalItems,
    grandTotal: parseFloat(grandTotal.toFixed(2)),
    items: itemsWithSubtotal,
    createdAt: fullCart.createdAt,
    updatedAt: fullCart.updatedAt,
  };
};

/**
 * GET CART
 */
const getBuyerCart = async (buyerId) => {
  const userCart = await getOrCreateCart(buyerId);
  const data = await getFullCartData(userCart.id);

  return {
    message: "Cart fetched successfully",
    data,
  };
};

/**
 * ADD PRODUCT TO CART
 * - If product is already in cart, increment quantity.
 */
const addProductToCart = async ({ buyerId, productId, qty = 1 }) => {
  if (!buyerId || !productId || !qty) {
    throwError("Please provide all required fields!", 400);
  }

  // 1. Validate quantity
  const quantity = parseInt(qty, 10);
  if (!Number.isInteger(quantity) || quantity < 1) {
    throwError("Quantity must be at least 1", 400);
  }

  // 2. Make sure the product exists and is active
  const product = await products.findOne({
    where: { id: productId, isActive: true },
  });

  if (!product) {
    throwError("Product not found or unavailable", 404);
  }

  // 3. Prevent buying your own product
  if (product.userId === buyerId) {
    throwError("You cannot add your own product to your cart", 400);
  }

  // 4. Get or create buyer's cart
  const userCart = await getOrCreateCart(buyerId);

  // 5. Check existing item in cart & validate stock
  const existingItem = await cartItems.findOne({
    where: { cartId: userCart.id, productId: product.id },
  });

  const alreadyInCart = existingItem ? existingItem.qty : 0;
  const totalRequested = alreadyInCart + quantity;

  if (totalRequested > product.stock) {
    throwError(
      `Only ${product.stock} item(s) in stock (you already have ${alreadyInCart} in cart)`,
      400,
    );
  }

  // 6. Insert or update item in cart
  if (existingItem) {
    await existingItem.update({ qty: totalRequested });
  } else {
    await cartItems.create({
      cartId: userCart.id,
      productId: product.id,
      qty: quantity,
    });
  }

  // 7. Return full updated cart
  const data = await getFullCartData(userCart.id);

  return {
    message: existingItem
      ? "Product quantity updated in cart"
      : "Product added to cart",
    data,
  };
};

/**
 * UPDATE OR DECREASE QUANTITY
 * If new qty <= 0, automatically removes the item from the cart.
 */
const updateCartItemQuantity = async ({ buyerId, productId, qty }) => {
  if (!buyerId || !productId || qty === undefined) {
    throwError("Please provide buyerId, productId, and qty!", 400);
  }

  const targetQty = parseInt(qty, 10);
  if (isNaN(targetQty)) {
    throwError("Quantity must be a valid number!", 400);
  }

  const userCart = await getOrCreateCart(buyerId);

  const item = await cartItems.findOne({
    where: { cartId: userCart.id, productId },
    include: [{ model: products, as: "product" }],
  });

  if (!item) {
    throwError("Product not found in your cart!", 404);
  }

  // If quantity reduced to 0 or less, delete the item
  if (targetQty <= 0) {
    await item.destroy();
    const data = await getFullCartData(userCart.id);
    return {
      message: "Product removed from cart",
      data,
    };
  }

  // Validate stock
  if (targetQty > item.product.stock) {
    throwError(
      `Only ${item.product.stock} item(s) in stock!`,
      400,
    );
  }

  await item.update({ qty: targetQty });

  const data = await getFullCartData(userCart.id);

  return {
    message: "Cart item quantity updated successfully",
    data,
  };
};

/**
 * REMOVE A PRODUCT FROM CART
 */
const removeProductFromCart = async ({ buyerId, productId }) => {
  if (!buyerId || !productId) {
    throwError("Please provide buyerId and productId!", 400);
  }

  const userCart = await getOrCreateCart(buyerId);

  const item = await cartItems.findOne({
    where: { cartId: userCart.id, productId },
  });

  if (!item) {
    throwError("Product not found in your cart!", 404);
  }

  await item.destroy();

  const data = await getFullCartData(userCart.id);

  return {
    message: "Product removed from cart successfully",
    data,
  };
};

/**
 * CLEAR ENTIRE CART
 */
const clearCart = async (buyerId) => {
  const userCart = await getOrCreateCart(buyerId);

  await cartItems.destroy({
    where: { cartId: userCart.id },
  });

  const data = await getFullCartData(userCart.id);

  return {
    message: "Cart cleared successfully",
    data,
  };
};

module.exports = {
  getOrCreateCart,
  getBuyerCart,
  addProductToCart,
  updateCartItemQuantity,
  removeProductFromCart,
  clearCart,
};
