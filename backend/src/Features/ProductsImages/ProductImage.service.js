const { productImages, products } = require("../../models");
const { throwError } = require("../../utils/appError");
const cloudinary = require("../../config/cloudinary");
const { uploadBufferImageToCloudinary } = require("../../utils/uploadImage");

// GET ALL IMAGES FOR A PRODUCT (Ordered by queue position 1 -> 4)
const getProductImages = async (productId) => {
  if (!productId) {
    throwError("Product ID is required!", 400);
  }

  const images = await productImages.findAll({
    where: { productId },
    order: [["position", "ASC"]],
  });

  return {
    message: "Get product images successfully!",
    data: images,
  };
};

// CREATE PRODUCT IMAGE (Queue Order: 1st upload -> 1, 2nd upload -> 2, up to 4)
const createProductImage = async ({
  userId,
  productId,
  fileImage,
}) => {
  if (!productId || !fileImage || !userId) {
    throwError("Please provide product ID, user ID, and an image file!", 400);
  }

  // Check product exists and belongs to seller
  const product = await products.findOne({ where: { id: productId, userId } });

  if (!product) {
    throwError("Product not found or unauthorized!", 404);
  }

  // Fetch current images ordered by position
  const existingImages = await productImages.findAll({
    where: { productId },
    order: [["position", "ASC"]],
  });

  if (existingImages.length >= 4) {
    throwError("Maximum limit of 4 product images reached for this product!", 400);
  }

  // Queue position: 1st upload -> 1, 2nd upload -> 2, 3rd -> 3, 4th -> 4
  const nextPosition = existingImages.length + 1;

  // 1. Fast upload (stores master image without slow synchronous transcoding)
  const fileUploadResult = await uploadBufferImageToCloudinary(fileImage.buffer, {
    folder: "nupor/product-images",
    resource_type: "image",
  });

  // 2. Generate on-the-fly optimized WebP / AVIF CDN URL
  const optimizedUrl = cloudinary.url(fileUploadResult.public_id, {
    secure: true,
    fetch_format: "auto", // Serves WebP/AVIF automatically to modern browsers
    quality: "auto",      // Smart lossy compression
  });

  const newImage = await productImages.create({
    productImageUrl: optimizedUrl,
    productPublicId: fileUploadResult.public_id,
    position: nextPosition,
    productId: product.id,
  });

  return {
    message: `Product image uploaded at position ${nextPosition} successfully!`,
    data: newImage,
  };
};

// UPDATE PRODUCT IMAGE AT SPECIFIC POSITION OR BY ID
const updateProductImage = async ({
  userId,
  productId,
  imageId,
  fileImage,
  position,
}) => {
  if (!productId || !userId) {
    throwError("Product ID and User ID are required!", 400);
  }

  const product = await products.findOne({ where: { id: productId, userId } });

  if (!product) {
    throwError("Product not found or unauthorized!", 404);
  }

  let targetImage;

  if (imageId) {
    targetImage = await productImages.findOne({
      where: { id: imageId, productId: product.id },
    });
  } else if (position) {
    targetImage = await productImages.findOne({
      where: { position: parseInt(position, 10), productId: product.id },
    });
  }

  if (!targetImage) {
    throwError("Product image not found for this product!", 404);
  }

  if (fileImage) {
    // Delete old image in Cloudinary in background
    if (targetImage.productPublicId) {
      cloudinary.uploader.destroy(targetImage.productPublicId).catch((err) => {
        console.error("Cloudinary background destroy error:", err);
      });
    }

    // 1. Fast upload
    const fileUploadResult = await uploadBufferImageToCloudinary(fileImage.buffer, {
      folder: "nupor/product-images",
      resource_type: "image",
    });

    // 2. Generate on-the-fly optimized WebP / AVIF CDN URL
    const optimizedUrl = cloudinary.url(fileUploadResult.public_id, {
      secure: true,
      fetch_format: "auto",
      quality: "auto",
    });

    await targetImage.update({
      productImageUrl: optimizedUrl,
      productPublicId: fileUploadResult.public_id,
    });
  }

  return {
    message: `Updated product image at position ${targetImage.position} successfully!`,
    data: targetImage,
  };
};

// REMOVE PRODUCT IMAGE (With Queue Re-Indexing: shifts remaining images up)
const removeProductImage = async ({ userId, productId, imageId, position }) => {
  if (!productId || !userId) {
    throwError("Product ID and User ID are required!", 400);
  }

  const product = await products.findOne({ where: { id: productId, userId } });

  if (!product) {
    throwError("Product not found or unauthorized!", 404);
  }

  let targetImage;

  if (imageId) {
    targetImage = await productImages.findOne({
      where: { id: imageId, productId: product.id },
    });
  } else if (position) {
    targetImage = await productImages.findOne({
      where: { position: parseInt(position, 10), productId: product.id },
    });
  }

  if (!targetImage) {
    throwError("Product image not found!", 404);
  }

  const deletedPosition = targetImage.position;

  // Delete from Cloudinary in background (non-blocking for fast <50ms response)
  if (targetImage.productPublicId) {
    cloudinary.uploader.destroy(targetImage.productPublicId).catch((err) => {
      console.error("Cloudinary background destroy error:", err);
    });
  }

  // Delete target image
  await targetImage.destroy();

  // Re-index remaining images to keep strict queue order (1, 2, 3...)
  const remainingImages = await productImages.findAll({
    where: { productId: product.id },
    order: [["position", "ASC"]],
  });

  for (let i = 0; i < remainingImages.length; i++) {
    const correctPos = i + 1;
    if (remainingImages[i].position !== correctPos) {
      await remainingImages[i].update({ position: correctPos });
    }
  }

  return {
    message: `Removed image from position ${deletedPosition}. Queue re-indexed successfully!`,
  };
};

module.exports = {
  getProductImages,
  createProductImage,
  updateProductImage,
  removeProductImage,
};