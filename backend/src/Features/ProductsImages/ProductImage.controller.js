const {
  getProductImages,
  createProductImage,
  updateProductImage,
  removeProductImage,
} = require("./ProductImage.service");

// GET PRODUCT IMAGES
const getProductImagesController = async (req, res) => {
  try {
    const { productId } = req.params;

    const result = await getProductImages(productId);

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

// CREATE/UPLOAD PRODUCT IMAGE CONTROLLER
const createProductImageController = async (req, res) => {
  try {
    const productId = req.params.productId || req.body.productId;
    const { position } = req.body;
    const userId = req.user.id;
    const file = req.file;

    const result = await createProductImage({
      productId,
      userId,
      fileImage: file,
      position,
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

// UPDATE PRODUCT IMAGE
const updateProductImageController = async (req, res) => {
  try {
    const productId = req.params.productId || req.body.productId;
    const imageId = req.params.imageId || req.body.imageId;
    const { position } = req.body;
    const userId = req.user.id;
    const file = req.file;

    const result = await updateProductImage({
      productId,
      imageId,
      userId,
      fileImage: file,
      position,
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

// REMOVE PRODUCT IMAGE
const removeProductImageController = async (req, res) => {
  try {
    const productId = req.params.productId || req.body.productId;
    const imageId = req.params.imageId || req.body.imageId;
    const { position } = req.body;
    const userId = req.user.id;

    const result = await removeProductImage({
      productId,
      imageId,
      position,
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
  getProductImagesController,
  createProductImageController,
  updateProductImageController,
  removeProductImageController,
};
