const jwt = require("jsonwebtoken");
const { users } = require("../models");

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];

    if (!authHeader) {
      return res
        .status(401)
        .json({ message: "Authorization header is missing!" });
    }

    const token = authHeader.split(" ")[1]; // Bearer <token>
    if (!token) {
      return res.status(401).json({ message: "Token is missing!" });
    }

    let decoded;

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || "access_secret");
    } catch (error) {
      return res.status(401).json({ message: "Invalid or expired token!" });
    }

    const user = await users.findOne({
      where: { id: decoded.id },
      attributes: { exclude: ["password"] },
    });

    if (!user) {
      return res.status(401).json({ message: "User not found!" });
    }

    if (!user.isActive || user.isBlocked) {
      return res
        .status(403)
        .json({ message: "Your account has been suspended!" });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized!" });
  }
};

module.exports = {
  authenticateToken
};