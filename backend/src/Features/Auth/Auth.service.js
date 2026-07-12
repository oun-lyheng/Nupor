const bcrypt = require("bcrypt");
const validator = require("validator");
const jwt = require("jsonwebtoken");
const { Op, where } = require("sequelize");
const {
  getVerificationEmail,
  getResetPasswordEmail,
} = require("../../utils/emailTemplate");
const {
  generateOtp,
  generateUsername,
} = require("../../utils/generateForUser");
const sendEmail = require("../../utils/sendEmail");
const sendSms = require("../../utils/sendSms");
const { users, otpCodes, refreshTokens } = require("../../models");

let aWeek =  new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
let tenMins = new Date(Date.now() + 10 * 60 * 1000);
let fifTeenMins = new Date(Date.now() + 15 * 60 * 1000);

const throwError = (message, status) => {
  const error = new Error(message);
  error.status = status;
  throw error;
};

const registerUser = async ({ fullName, email, phoneNumber, password }) => {
  if (!email && !phoneNumber) {
    throwError("Please choose one to register: email or phone number!", 400);
  }

  // Email format validation (only if email is provided)
  if (email && !validator.isEmail(email)) {
    throwError("Invalid email format", 400);
  }

  // Password strength validation
  if (
    !validator.isStrongPassword(password, {
      minLength: 8,
      minUppercase: 0,
      minLowercase: 0,
      minNumbers: 0,
      minSymbols: 0,
    })
  ) {
    throwError("Weak password: at least 8 characters required", 400);
  }

  // Build dynamic where conditions to avoid passing undefined values to Sequelize
  const searchConditions = [];
  if (email) searchConditions.push({ email });
  if (phoneNumber) searchConditions.push({ phoneNumber });

  const existingUser = await users.findOne({
    where: {
      [Op.or]: searchConditions,
    },
  });

  const otpCode = generateOtp();
  const hashPassword = await bcrypt.hash(password, 10);
  const userNameGenerate = await generateUsername(fullName);
  const emailValue = email || null;
  const phoneValue = phoneNumber || null;

  if (existingUser) {
    // If user exists and is verified, reject registration
    if (existingUser.isVerified) {
      throwError("This email or phone number is already registered", 409);
    }

    // If user exists but is not verified, update their info and resend OTP
    await existingUser.update({
      fullName,
      userName: userNameGenerate,
      email: emailValue,
      phoneNumber: phoneValue,
      password: hashPassword,
    });

    // Clean up old OTP codes for this user
    await otpCodes.destroy({ where: { userId: existingUser.id } });

    // Save new OTP code
    await otpCodes.create({
      code: otpCode,
      userId: existingUser.id,
      expireAt: tenMins ,
      type: "register",
      isUsed: false,
    });

    // Send verification code via Email or SMS
    if (emailValue) {
      await sendEmail(
        emailValue,
        "Nupor - Verify OTP Code",
        getVerificationEmail(fullName, otpCode),
      );
    } else if (phoneValue) {
      await sendSms(phoneValue, `Your Nupor verification code is: ${otpCode}. Valid for 10 minutes.`);
    }

    return {
      message: emailValue
        ? "Register code resent. Please check your email for OTP verification."
        : "Register code resent. Please check your phone for SMS OTP verification.",
      userId: existingUser.id,
    };
  }

  // 5. Register new user
  const user = await users.create({
    fullName,
    userName: userNameGenerate,
    email: emailValue,
    phoneNumber: phoneValue,
    password: hashPassword,
  });

  // Save new OTP code
  await otpCodes.create({
    code: otpCode,
    userId: user.id,
    expireAt: tenMins ,
    type: "register",
    isUsed: false,
  });

  // Send verification code via Email or SMS
  if (emailValue) {
    await sendEmail(
      emailValue,
      "Nupor - Verify Your Email",
      getVerificationEmail(fullName, otpCode),
    );
  } else if (phoneValue) {
    await sendSms(phoneValue, `Your Nupor verification code is: ${otpCode}. Valid for 10 minutes.`);
  }

  return {
    message: emailValue
      ? "Register successfully. Please check your email for OTP verification."
      : "Register successfully. Please check your phone for SMS OTP verification.",
    userId: user.id,
  };
};

// VERIFY OTP CODE
const verifyOtpCode = async ({ code, userId }) => {
  if (!code) {
    throwError("Please provide otp code", 400);
  }

  // Find otp code in table
  const otpCodeInTable = await otpCodes.findOne({
    where: { code, userId, type: "register", isUsed: false },
  });
  if (!otpCodeInTable) {
    throwError("Invalid OTP code!", 404);
  }

  let currentDate = new Date();
  if (currentDate > otpCodeInTable.expireAt) {
    throwError("OTP code is expired!", 401);
  }

  const user = await users.findOne({ where: { id: otpCodeInTable.userId } });
  if (!user) {
    throwError("User not found!", 404);
  }

  const accessToken = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN },
  );

  const refreshToken = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN },
  );

  await refreshTokens.create({
    token: refreshToken,
    expires_at: aWeek ,
    userId: user.id,
  });

  // MARK OTP CODE IS USED
  await otpCodeInTable.update({
    isUsed: true,
  });

  // MARK USER IS VERIFIED
  await user.update({
    isVerified: true,
  });

  // will send refreshToken to cookies , right now testing on postamn first
  return {
    message: "Verify Otp code successfully!",
    refreshToken: refreshToken,
    accessToken: accessToken,
  };
};

// LOGIN WITH GMAIL
const loginInService = async ({ email, phoneNumber, password }) => {
  // 1. Basic validation
  if ((!email && !phoneNumber) || !password) {
    throwError("Please provide email or password", 400);
  }

  // 2. Email format validation
  if (email && !validator.isEmail(email)) {
    throwError("Invalid email format", 400);
  }

  // 3. Find user
  const loginConditions = [];
  if (email) loginConditions.push({ email });
  if (phoneNumber) loginConditions.push({ phoneNumber });

  const user = await users.findOne({
    where: {
      [Op.or]: loginConditions,
    },
  });

  if (!user) {
    throwError("Invalid email or password", 401);
  }

  // 4. Verify password
  const isPasswordSame = await bcrypt.compare(password, user.password);
  if (!isPasswordSame) {
    throwError("Invalid email , phone number or password", 401);
  }

  // 5. Check user status
  if (!user.isActive) {
    throwError("Account is suspended  or deadactive", 403);
  }
  if (user.isBlocked) {
    throwError("Account is blocked", 403);
  }
  if (!user.isVerified) {
    throwError("Please verify your account first", 403);
  }

  // 6. Clean up expired/revoked refresh tokens
  await refreshTokens.destroy({
    where: {
      userId: user.id,
      [Op.or]: [{ expires_at: { [Op.lt]: new Date() } }, { isRevoked: true }],
    },
  });

  // 7. Generate tokens
  const accessToken = jwt.sign(
    { id: user.id, role: user.role, isSeller: user.isSeller },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN },
  );

  // after testing change refreshToken to cookie
  const refreshToken = jwt.sign(
    { id: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN },
  );


  await refreshTokens.create({
    token: refreshToken,
    expires_at: aWeek ,
    userId: user.id,
    isRevoked: false,
  });

  return {
    message: "Login Successfully!",
    accessToken,
    refreshToken,
  };
};

// FORGOT PASSWORD
const forgotPassword = async ({ email, phoneNumber }) => {
  if (!email && !phoneNumber) {
    throwError("Please provide email or phone number!", 400);
  }

  if (email && !validator.isEmail(email)) {
    throwError("Invalid email format!", 400);
  }

  // check if user exists
  const loginConditions = [];
  if (email) loginConditions.push({ email });
  if (phoneNumber) loginConditions.push({ phoneNumber });

  const user = await users.findOne({
    where: {
      [Op.or]: loginConditions,
    },
  });

  if (!user) {
    throwError("There is no email or phone number that exists!", 404);
  }

  const otpCode = generateOtp();

  if (email) {
    await sendEmail(
      email,
      "Nupor - Reset Your Password",
      getResetPasswordEmail(user.fullName, otpCode),
    );
  } else if (phoneNumber) {
    await sendSms(phoneNumber, `Your Nupor password reset code is: ${otpCode}. Valid for 10 minutes.`);
  }

  // REMOVE OLD FORGOT PASSWORD OTP
  await otpCodes.destroy({ where: { userId: user.id, type: "forgot_password" } });
  
  // CREATE A NEW ONE FOR FORGOTPASSWORD
  await otpCodes.create({
    code: otpCode,
    userId: user.id,
    expireAt: tenMins ,
    type: "forgot_password",
    isUsed: false,
  });

  return {
    message: email
      ? "If that account exists, an OTP has been sent successfully."
      : "If that account exists, an OTP has been sent successfully via SMS.",
  };
};

// VERIFY FORGOT OTP FOR RESET PASSWORD
const verifyForgotPasswordOtp = async ({ email, phoneNumber, code }) => {
  if (!code) {
    throwError("Please provide otp code!", 400);
  }

  const loginConditions = [];
  if (email) loginConditions.push({ email });
  if (phoneNumber) loginConditions.push({ phoneNumber });

  const user = await users.findOne({ where: { [Op.or]: loginConditions } });
  if (!user) {
    throwError("There is no email or phone number that exists!", 404);
  }

  const otpCode = await otpCodes.findOne({ 
    where: { 
      code,
      userId: user.id,
      type: "forgot_password",
      isUsed: false 
    } 
  });
  
  if (!otpCode) {
    throwError("Invalid otp code!", 404);
  }

  if (new Date() > otpCode.expireAt) {
    throwError("This otp code is expired!", 401);
  }

  await otpCode.update({
    isUsed: true,
  });

  const resetToken = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_RESET_SECRET  + user.password,
    { expiresIn: "15m" },
  );

  return {
    message: "OTP verified successfully. You can now reset your password.",
    resetToken: resetToken,
  };
};

// RESET PASSWORD
const resetPassword = async ({ newPassword, resetToken }) => {
  if (!newPassword) {
    throwError("Please provide a new password!", 400);
  }

  if (!resetToken) {
    throwError("Reset token is missing or expired!", 400);
  }

  if (
    !validator.isStrongPassword(newPassword, {
      minLength: 8,
      minUppercase: 0,
      minLowercase: 0,
      minNumbers: 0,
      minSymbols: 0,
    })
  ) {
    throwError("Weak password: at least 8 characters required", 400);
  }

  let userId;
  let user;
  try {
    const decodedPayload = jwt.decode(resetToken);
    if (!decodedPayload) {
      throwError("Invalid reset token or expired!", 400);
    }

    userId = decodedPayload.id;
    user = await users.findOne({ where: { id: userId } });
    if (!user) {
      throwError("This user not found!", 404);
    }

    jwt.verify(resetToken, (process.env.JWT_RESET_SECRET || "reset_secret") + user.password);
  } catch (error) {
    throwError("Invalid or expired reset token", 401);
    return {errorMessage : error.message}
  }

  const hashPassword = await bcrypt.hash(newPassword, 10);
  await user.update({
    password: hashPassword,
  });

  // delete all the refreshTokens where they belong to this user
  await refreshTokens.destroy({ where: { userId } });

  const accessToken = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET || "access_secret",
    { expiresIn: process.env.JWT_EXPIRES_IN || "15m" },
  );

  return {
    message: "Reset password successfully! Please login again",
    accessToken: accessToken,
  };
};

// CHANGE PASSWORD
const changePassword = async ({ currentPassword, newPassword, userId }) => {
  if (!newPassword || !currentPassword) {
    throwError("Please provide all passwords!", 400);
  }

  const user = await users.findOne({ where: { id: userId } });
  if (!user) {
    throwError("User not found!", 404);
  }

  if (
    !validator.isStrongPassword(newPassword, {
      minLength: 8,
      minUppercase: 0,
      minLowercase: 0,
      minNumbers: 0,
      minSymbols: 0,
    })
  ) {
    throwError("Weak password: at least 8 characters required", 400);
  }

  // check current password 
  const isSamePassword = await bcrypt.compare(currentPassword, user.password);
  if (!isSamePassword) {
    throwError("Current password is not matching!", 401);
  }

  // create new password
  const hashPassword = await bcrypt.hash(newPassword, 10);

  await user.update({
    password: hashPassword
  });

  // Revoke all refresh tokens for this user on password change
  await refreshTokens.update(
    { isRevoked: true },
    { where: { userId: user.id } }
  );
  
  return {
    message: "Update password successfully, please log in again!", 
  };
};

// RESEND OTP CODE
const resendOtpCode = async ({ userId }) => {
  if (!userId) {
    throwError("Please provide user id!", 400);
  }

  const user = await users.findOne({ where: { id: userId } }); 
  if (!user) {
    throwError("This user is not found!", 404);
  }

  if (user.isVerified === true) {
    throwError("This user is already verified!", 400);
  }

  // Destroy old OTPs
  await otpCodes.destroy({ where: { userId: user.id } });

  const newOtpCode = generateOtp();

  if (user.email) {
    await sendEmail(
      user.email,
      "Nupor - Verify Your Email",
      getVerificationEmail(user.fullName, newOtpCode)
    );
  } else if (user.phoneNumber) {
    await sendSms(user.phoneNumber, `Your Nupor verification code is: ${newOtpCode}. Valid for 10 minutes.`);
  }

  await otpCodes.create({
    code: newOtpCode, 
    expireAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    type: "register",
    isUsed: false,
    userId: user.id
  });

  return {
    message: user.email
      ? "OTP sent successfully! Please check your email."
      : "OTP sent successfully! Please check your phone for SMS OTP verification."
  };
};

// REFRESH TOKEN FUNCTION
const refreshTokenFunc = async ({ refreshToken }) => {
  if (!refreshToken) {
    throwError("Refresh token is missing!", 400);
  }

  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || "refresh_secret");
  } catch (error) {
    throwError("Invalid or expired refresh token!", 401);
  }

  const findRefreshToken = await refreshTokens.findOne({
    where: { 
      token: refreshToken,
      userId: decoded.id,
      isRevoked: false
    }
  });

  if (!findRefreshToken) {
    throwError("Refresh token not found or revoked!", 401);
  }

  if (new Date() > findRefreshToken.expires_at) {
    throwError("Refresh token is expired!", 401);
  }

  const user = await users.findOne({ where: { id: decoded.id } });
  if (!user) {
    throwError("This user is not found!", 404);
  }

  // create new accessToken 
  const accessToken = jwt.sign(
    { id: user.id, role: user.role, isSeller: user.isSeller },
    process.env.JWT_SECRET || "access_secret",
    { expiresIn: process.env.JWT_EXPIRES_IN || "15m" }
  );

  return {
    accessToken: accessToken
  };
};

// LOGOUT 
const logOut = async ({ userId }) => {
  if (!userId) {
    throwError("Please provide user id!", 400);
  }

  const user = await users.findOne({ where: { id: userId } });
  if (!user) {
    throwError("This user is not found!", 404);
  }

  await refreshTokens.update(
    { isRevoked: true },
    { where: { userId: user.id } }
  );

  return {
    message: "Log out successfully!"
  };
};

module.exports = {
  registerUser,
  verifyOtpCode,
  loginInService,
  forgotPassword,
  verifyForgotPasswordOtp,
  resetPassword,
  changePassword ,
  resendOtpCode ,
  refreshTokenFunc , 
  logOut 
};
