const {
  cart,
  cartItems,
  products,
  productImages,
  product_variants,
  users,
  user_profiles,
} = require("../../models");
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
 * Groups items into "shops" by seller for Shopee-style per-seller checkout
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
            model: product_variants,
            as: "variant",
          },
          {
            model: products,
            as: "product",
            include: [
              { model: productImages, as: "images" },
              {
                model: users,
                as: "seller",
                attributes: ["id", "fullName", "userName"],
                include: [
                  {
                    model: user_profiles,
                    as: "profile",
                    attributes: [
                      "profile_url",
                      "accountName",
                      "accountNumber",
                      "khqrUrl",
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
    order: [[{ model: cartItems, as: "items" }, "createdAt", "DESC"]],
  });

  if (!fullCart) return null;

  // Calculate totals and group by shop/seller
  let grandTotal = 0;
  let totalItems = 0;
  const shopsMap = {};

  const itemsWithSubtotal = fullCart.items.map((item) => {
    // If item has a variant, use variant price; otherwise use base product price
    const unitPrice = item.variant
      ? parseFloat(item.variant.price)
      : parseFloat(item.product.price);
    const subtotal = unitPrice * item.qty;
    grandTotal += subtotal;
    totalItems += item.qty;

    const formattedItem = {
      ...item.toJSON(),
      unitPrice,
      variantName: item.variant ? item.variant.variantName : null,
      variantAttributes: item.variant ? item.variant.attributes : null,
      subtotal: parseFloat(subtotal.toFixed(2)),
    };

    // Grouping by seller
    const seller = item.product.seller;
    const profile = seller?.profile;
    const sellerId = seller.id;

    if (!shopsMap[sellerId]) {
      shopsMap[sellerId] = {
        sellerId: seller.id,
        fullName: seller.fullName,
        userName: seller.userName,
        profile_url: profile?.profile_url,
        khqrUrl: profile?.khqrUrl,
        accountName: profile?.accountName,
        accountNumber: profile?.accountNumber,
        subTotal: 0,
        totalItems: 0,
        items: [],
      };
    }

    shopsMap[sellerId].items.push(formattedItem);
    shopsMap[sellerId].subTotal = parseFloat(
      (shopsMap[sellerId].subTotal + formattedItem.subtotal).toFixed(2)
    );
    shopsMap[sellerId].totalItems += item.qty;

    return formattedItem;
  });

  return {
    id: fullCart.id,
    buyerId: fullCart.buyerId,
    totalItems,
    grandTotal: parseFloat(grandTotal.toFixed(2)),
    shops: Object.values(shopsMap),
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
 * - If product (or product variant) is already in cart, increment quantity.
 */
const addProductToCart = async ({ buyerId, productId, variantId = null, qty = 1 }) => {
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

  // 4. Validate variant if provided
  let variant = null;
  if (variantId) {
    variant = await product_variants.findOne({
      where: { id: variantId, productId: product.id, isActive: true },
    });
    if (!variant) {
      throwError("Selected product variant not found or unavailable", 404);
    }
  }

  // 5. Get or create buyer's cart
  const userCart = await getOrCreateCart(buyerId);

  // 6. Check existing item in cart & validate stock
  const itemWhere = {
    cartId: userCart.id,
    productId: product.id,
    variantId: variant ? variant.id : null,
  };

  const existingItem = await cartItems.findOne({ where: itemWhere });

  const alreadyInCart = existingItem ? existingItem.qty : 0;
  const totalRequested = alreadyInCart + quantity;

  const availableStock = variant ? variant.stock : product.stock;
  const itemLabel = variant ? `variant "${variant.variantName}"` : "product";

  if (totalRequested > availableStock) {
    throwError(
      `Only ${availableStock} item(s) in stock for this ${itemLabel} (you already have ${alreadyInCart} in cart)`,
      400
    );
  }

  // 7. Insert or update item in cart
  if (existingItem) {
    await existingItem.update({ qty: totalRequested });
  } else {
    await cartItems.create({
      cartId: userCart.id,
      productId: product.id,
      variantId: variant ? variant.id : null,
      qty: quantity,
    });
  }

  // 8. Return full updated cart
  const data = await getFullCartData(userCart.id);

  return {
    message: existingItem
      ? "Cart item quantity updated"
      : "Product added to cart",
    data,
  };
};

/**
 * UPDATE OR DECREASE QUANTITY
 * If new qty <= 0, automatically removes the item from the cart.
 */
const updateCartItemQuantity = async ({
  buyerId,
  cartItemId,
  productId,
  variantId,
  qty,
}) => {
  if (!buyerId || qty === undefined) {
    throwError("Please provide buyerId and qty!", 400);
  }

  const targetQty = parseInt(qty, 10);
  if (isNaN(targetQty)) {
    throwError("Quantity must be a valid number!", 400);
  }

  const userCart = await getOrCreateCart(buyerId);

  let itemWhere = { cartId: userCart.id };
  if (cartItemId) {
    itemWhere.id = cartItemId;
  } else if (productId) {
    itemWhere.productId = productId;
    itemWhere.variantId = variantId ? parseInt(variantId, 10) : null;
  } else {
    throwError("Please provide cartItemId or productId!", 400);
  }

  const item = await cartItems.findOne({
    where: itemWhere,
    include: [
      { model: products, as: "product" },
      { model: product_variants, as: "variant" },
    ],
  });

  if (!item) {
    throwError("Item not found in your cart!", 404);
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

  // Validate stock against variant or product
  const availableStock = item.variant ? item.variant.stock : item.product.stock;
  if (targetQty > availableStock) {
    throwError(
      `Only ${availableStock} item(s) in stock!`,
      400
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
const removeProductFromCart = async ({
  buyerId,
  cartItemId,
  productId,
  variantId,
}) => {
  if (!buyerId) {
    throwError("Please provide buyerId!", 400);
  }

  const userCart = await getOrCreateCart(buyerId);

  let itemWhere = { cartId: userCart.id };
  if (cartItemId) {
    itemWhere.id = cartItemId;
  } else if (productId) {
    itemWhere.productId = productId;
    itemWhere.variantId = variantId ? parseInt(variantId, 10) : null;
  } else {
    throwError("Please provide cartItemId or productId!", 400);
  }

  const item = await cartItems.findOne({
    where: itemWhere,
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
