const rateLimit = require("express-rate-limit");

 const loginLimiter = rateLimit({
  windowMs: 3 * 60 * 1000, // 3 minutes
  max: 10, // max 10 attempts
  message: {
    message: "Too many login attempts, please try again after 3 minutes"
  }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // max 5 attempts
  message: {
    message: "Too many requests. Please try again after 15 minutes"
  }
});

const otpVerificationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // max 5 attempts
  message: {
    message: "Too many verification attempts. Please try again after 15 minutes"
  }
});

module.exports = {
    loginLimiter ,
    authLimiter ,
    otpVerificationLimiter 
}
