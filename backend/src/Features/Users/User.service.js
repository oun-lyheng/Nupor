const { users, user_profiles } = require("../../models");
const { throwError } = require("../../utils/appError");
const { uploadBufferImageToCloudinary } = require("../../utils/uploadImage");

/**
 * GET CURRENT USER PROFILE
 */
const getUserProfile = async (userId) => {
  let user = await users.findByPk(userId, {
    attributes: { exclude: ["password"] },
    include: [
      {
        model: user_profiles,
        as: "profile",
      },
    ],
  });

  if (!user) {
    throwError("User not found!", 404);
  }

  // If user_profiles record does not exist yet, create default
  if (!user.profile) {
    const [profile] = await user_profiles.findOrCreate({
      where: { userId: user.id },
      defaults: { userId: user.id },
    });
    user = await users.findByPk(userId, {
      attributes: { exclude: ["password"] },
      include: [{ model: user_profiles, as: "profile" }],
    });
  }

  return {
    message: "User profile fetched successfully",
    data: user,
  };
};

const sanitizeTelegramUsername = (username) => {
  if (!username) return null;
  let clean = username.trim();
  clean = clean.replace(/^(?:https?:\/\/)?(?:www\.)?t\.me\//i, "");
  clean = clean.replace(/^@+/, "");
  return clean || null;
};

/**
 * UPDATE USER PROFILE (Name, Phone, Gender, Bio, Telegram, Avatar image)
 */
const updateUserProfile = async ({
  userId,
  fullName,
  phoneNumber,
  gender,
  bio,
  telegramUsername,
  fileBuffer,
}) => {
  const user = await users.findByPk(userId, {
    attributes: { exclude: ["password"] },
    include: [{ model: user_profiles, as: "profile" }],
  });

  if (!user) {
    throwError("User not found!", 404);
  }

  // Ensure profile record exists
  let profile = user.profile;
  if (!profile) {
    profile = await user_profiles.create({ userId: user.id });
  }

  // Update user fields
  if (fullName !== undefined) user.fullName = fullName.trim();
  if (phoneNumber !== undefined) user.phoneNumber = phoneNumber.trim();
  if (gender !== undefined) user.gender = gender;
  await user.save();

  // If avatar image uploaded, send to Cloudinary
  if (fileBuffer) {
    const uploadResult = await uploadBufferImageToCloudinary(fileBuffer, {
      folder: "nupor/avatars",
    });
    profile.profile_url = uploadResult.secure_url;
    profile.profile_publicId = uploadResult.public_id;
  }

  if (bio !== undefined) {
    profile.bio = bio ? bio.trim() : null;
  }

  if (telegramUsername !== undefined) {
    profile.telegramUsername = sanitizeTelegramUsername(telegramUsername);
  }

  await profile.save();

  const updatedUser = await users.findByPk(userId, {
    attributes: { exclude: ["password"] },
    include: [{ model: user_profiles, as: "profile" }],
  });

  return {
    message: "Profile updated successfully",
    data: updatedUser,
  };
};

/**
 * UPDATE SELLER PAYMENT INFO (KHQR image, Account Name, Account Number, Telegram)
 */
const updateSellerPaymentInfo = async ({
  userId,
  accountName,
  accountNumber,
  telegramUsername,
  fileBuffer,
}) => {
  const user = await users.findByPk(userId, {
    attributes: { exclude: ["password"] },
    include: [{ model: user_profiles, as: "profile" }],
  });

  if (!user) {
    throwError("User not found!", 404);
  }

  let profile = user.profile;
  if (!profile) {
    profile = await user_profiles.create({ userId: user.id });
  }

  // Upload KHQR code image to Cloudinary if provided
  if (fileBuffer) {
    const uploadResult = await uploadBufferImageToCloudinary(fileBuffer, {
      folder: "nupor/seller_khqr",
    });
    profile.khqrUrl = uploadResult.secure_url;
    profile.khqrPublic_id = uploadResult.public_id;
  }

  if (accountName !== undefined) {
    profile.accountName = accountName ? accountName.trim().toUpperCase() : null;
  }

  if (accountNumber !== undefined) {
    profile.accountNumber = accountNumber ? accountNumber.trim() : null;
  }

  if (telegramUsername !== undefined) {
    profile.telegramUsername = sanitizeTelegramUsername(telegramUsername);
  }

  await profile.save();

  // Automatically activate seller status when setting up payment info
  if (!user.isSeller) {
    user.isSeller = true;
    await user.save();
  }

  const updatedUser = await users.findByPk(userId, {
    attributes: { exclude: ["password"] },
    include: [{ model: user_profiles, as: "profile" }],
  });

  return {
    message: "Seller payment information updated successfully",
    data: updatedUser,
  };
};

/**
 * BECOME A SELLER (Accept marketplace terms & conditions)
 */
const becomeSeller = async (userId) => {
  const user = await users.findByPk(userId, {
    attributes: { exclude: ["password"] },
  });

  if (!user) {
    throwError("User not found!", 404);
  }

  if (user.isSeller) {
    return {
      message: "You are already a registered seller!",
      data: user,
    };
  }

  user.isSeller = true;
  await user.save();

  return {
    message: "Congratulations! You are now registered as a seller.",
    data: user,
  };
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  updateSellerPaymentInfo,
  becomeSeller,
};
