
const {
  registerUser,
  loginWithGmail,
  verifyOtpCode,
  loginInService,
  forgotPassword,
  verifyForgotPasswordOtp,
  resetPassword,
  changePassword,
  resendOtpCode,
  refreshTokenFunc,
  logOut,
} = require("./Auth.service");

// REGISTER
const registerController = async (req, res) => {
  try {
    const { fullName, email, phoneNumber, password } = req.body;

    const result = await registerUser({
      fullName,
      email,
      phoneNumber,
      password,
    });

    return res.status(201).json({
      message: result.message,
      userId: result.userId,
    });
  } catch (error) {
    const statusCode = error.status || 500;
    return res.status(statusCode).json({
      message: error.message,
    });
  }
};

const verifyOtpController = async (req, res) => {
  try {
    const { code, userId } = req.body;

    const result = await verifyOtpCode({ code, userId });

    res.json({
      result,
    });
  } catch (error) {
    const statusCode = error.status || 500;
    return res.status(statusCode).json({
      errorMessage: error.message,
    });
  }
};

// LOGIN
const loginController = async (req, res) => {
  try {
    const { email, phoneNumber, password } = req.body;

    const result = await loginInService({ email, phoneNumber, password });

    return res.json({
      result,
    });
  } catch (error) {
    const statusCode = error.status || 500;
    return res.status(statusCode).json({
      message: error.message,
    });
  }
};

const forgotPasswordController = async (req, res) => {
  try {
    const { email, phoneNumber } = req.body;

    const result = await forgotPassword({ email, phoneNumber });

    res.json({
      result,
    });
  } catch (error) {
    const statusCode = error.status || 500;
    return res.status(statusCode).json({
      message: error.message,
    });
  }
};

const verifyForgotPasswordController = async (req, res) => {
  try {
    const { email, phoneNumber , code} = req.body;

    const result = await verifyForgotPasswordOtp({ email, phoneNumber ,code });

    res.json({
      result,
    });
  } catch (error) {
    const statusCode = error.status || 500;
    return res.status(statusCode).json({
      message: error.message,
    });
  }
};

const resetPasswordController = async (req, res) => {
  try {
    const { newPassword , resetToken } = req.body;

    // request resetToken when do frontend
    // const resetToken = req.cookie.resetToken

    const result = await resetPassword({ newPassword , resetToken });

    res.json({
      result,
    });
  } catch (error) {
    const statusCode = error.status || 500;
    return res.status(statusCode).json({
      message: error.message,
    });
  }
};

const changePasswordController = async (req, res) => {
  try {
    const { currentPassword , newPassword, userId } = req.body;

    const result = await changePassword({ 
      currentPassword, 
      newPassword, 
      userId: userId || req.user?.id 
    });

    res.json({
      result,
    });
  } catch (error) {
    const statusCode = error.status || 500;
    return res.status(statusCode).json({
      message: error.message,
    });
  }
};

const resendOtpCodeController = async (req, res) => {
  try {
    const { userId } = req.body;

    const result = await resendOtpCode({ userId });

    res.json({
      result,
    });
  } catch (error) {
    const statusCode = error.status || 500;
    return res.status(statusCode).json({
      message: error.message,
    });
  }
};

// REFRESH TOKEN CONTROLLER
const refreshTokenController = async (req, res) => {
  try {
    
    const {refreshToken } = req.body

    // request cookie refresh token when do frontend
    // const refreshToken = req.cookies.refreshToken ;

    const result = await refreshTokenFunc({ refreshToken });

    res.json({
      result,
    });
  } catch (error) {
    const statusCode = error.status || 500;
    return res.status(statusCode).json({
      message: error.message,
    });
  }
};

const logOutController = async (req, res) => {
  try {
    const userId = req.body?.userId || req.user?.id;

    const result = await logOut({ userId });

    res.json({
      result,
    });
  } catch (error) {
    const statusCode = error.status || 500;
    return res.status(statusCode).json({
      message: error.message,
    });
  }
};

module.exports = {
  registerController,
  verifyOtpController,
  loginController,
  forgotPasswordController,
  verifyForgotPasswordController,
  resetPasswordController,
  changePasswordController,
  resendOtpCodeController ,
  refreshTokenController ,
  logOutController
};
