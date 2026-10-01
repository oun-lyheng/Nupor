const {
  getUserProfile,
  updateUserProfile,
  updateSellerPaymentInfo,
  becomeSeller,
} = require("./User.service");

// GET CURRENT USER PROFILE
const getUserProfileController = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await getUserProfile(userId);

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

// UPDATE USER PROFILE
const updateUserProfileController = async (req, res) => {
  try {
    const userId = req.user.id;
    const { fullName, phoneNumber, gender, bio } = req.body;
    const fileBuffer = req.file ? req.file.buffer : null;

    const result = await updateUserProfile({
      userId,
      fullName,
      phoneNumber,
      gender,
      bio,
      fileBuffer,
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

// UPDATE SELLER PAYMENT INFO
const updateSellerPaymentInfoController = async (req, res) => {
  try {
    const userId = req.user.id;
    const { accountName, accountNumber } = req.body;
    const fileBuffer = req.file ? req.file.buffer : null;

    const result = await updateSellerPaymentInfo({
      userId,
      accountName,
      accountNumber,
      fileBuffer,
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

// BECOME SELLER
const becomeSellerController = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await becomeSeller(userId);

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
  getUserProfileController,
  updateUserProfileController,
  updateSellerPaymentInfoController,
  becomeSellerController,
};
