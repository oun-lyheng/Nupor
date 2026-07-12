const express = require("express") ;
const router = express.Router()

const { registerController, loginController , verifyOtpController ,  forgotPasswordController , 
  verifyForgotPasswordController ,
  resetPasswordController, 
  changePasswordController,
  resendOtpCodeController,
  refreshTokenController,
  logOutController} = require("./Auth.controller");
const { authenticateToken } = require("../../middlewares/authenticate");
const { authLimiter ,loginLimiter, otpVerificationLimiter } = require("../../utils/rateLimits");

router.post("/register", authLimiter, registerController);
router.post("/verify", otpVerificationLimiter, verifyOtpController);
router.post("/login", loginLimiter , loginController);
router.post("/forgot-password", forgotPasswordController);
router.post("/verify-forgot-otp", verifyForgotPasswordController);
router.post("/reset-password", resetPasswordController);
router.post("/change-password", authenticateToken ,  changePasswordController);
router.post("/resend-otpcode", otpVerificationLimiter , resendOtpCodeController);
router.post("/refreshtoken", refreshTokenController);
router.post("/logout", authenticateToken , logOutController);

module.exports = router;
