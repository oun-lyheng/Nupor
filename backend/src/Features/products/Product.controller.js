const {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  addVariantToProduct,
  updateVariant,
  deleteVariant,
} = require("./Product.service");

// CREATE PRODUCT
const createProductController = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      productName,
      description,
      price,
      originalPrice,
      orginalPrice,
      stock,
      categoryIds,
      isBestSeller = false,
      variants,
    } = req.body;

    const result = await createProduct({
      userId,
      productName,
      description,
      price,
      originalPrice: originalPrice !== undefined ? originalPrice : orginalPrice,
      stock,
      categoryIds,
      isBestSeller,
      variants,
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

// GET ALL PRODUCTS
const getAllProductsController = async (req, res) => {
  try {
    const {
      q,
      categoryId,
      categorySlug,
      minPrice,
      maxPrice,
      minRating,
      inStock,
      sellerId,
      sortBy,
      page,
      limit,
    } = req.query;

    const result = await getAllProducts({
      q,
      categoryId,
      categorySlug,
      minPrice,
      maxPrice,
      minRating,
      inStock,
      sellerId,
      sortBy,
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

// GET PRODUCT BY ID
const getProductByIdController = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await getProductById(id);

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

// UPDATE PRODUCT BY ID
const updateProductByIdController = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const {
      productName,
      description,
      price,
      originalPrice,
      orginalPrice,
      stock,
      categoryIds,
      isBestSeller,
      isActive,
    } = req.body;

    const result = await updateProduct({
      id,
      userId,
      productName,
      description,
      price,
      originalPrice: originalPrice !== undefined ? originalPrice : orginalPrice,
      stock,
      categoryIds,
      isBestSeller,
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

// REMOVE PRODUCT
const removeProductController = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await deleteProduct({ id, userId });

    return res.status(200).json({
      message: result.message,
    });
  } catch (error) {
    const statusCode = error.status || 500;
    return res.status(statusCode).json({
      message: error.message,
    });
  }
};

// ADD VARIANT TO PRODUCT
const addVariantController = async (req, res) => {
  try {
    const productId = req.params.id;
    const userId = req.user.id;
    const {
      variantName,
      price,
      originalPrice,
      stock,
      sku,
      attributes,
      imageUrl,
    } = req.body;

    const result = await addVariantToProduct({
      productId,
      userId,
      variantName,
      price,
      originalPrice,
      stock,
      sku,
      attributes,
      imageUrl,
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

// UPDATE VARIANT
const updateVariantController = async (req, res) => {
  try {
    const { variantId } = req.params;
    const userId = req.user.id;
    const {
      variantName,
      price,
      originalPrice,
      stock,
      sku,
      attributes,
      imageUrl,
      isActive,
    } = req.body;

    const result = await updateVariant({
      variantId,
      userId,
      variantName,
      price,
      originalPrice,
      stock,
      sku,
      attributes,
      imageUrl,
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

// DELETE VARIANT
const deleteVariantController = async (req, res) => {
  try {
    const { variantId } = req.params;
    const userId = req.user.id;

    const result = await deleteVariant({
      variantId,
      userId,
    });

    return res.status(200).json({
      message: result.message,
    });
  } catch (error) {
    const statusCode = error.status || 500;
    return res.status(statusCode).json({
      message: error.message,
    });
  }
};

module.exports = {
  createProductController,
  getAllProductsController,
  getProductByIdController,
  updateProductByIdController,
  removeProductController,
  addVariantController,
  updateVariantController,
  deleteVariantController,
};
