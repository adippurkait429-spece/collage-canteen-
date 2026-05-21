/**
 * middleware/adminAuth.js
 *
 * JWT-based authentication middleware for admin-only routes.
 * The admin logs in via POST /api/admin/login and receives a JWT.
 * All subsequent admin API calls must include:
 *   Authorization: Bearer <token>
 */

const jwt = require("jsonwebtoken");

const adminAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Access denied. No token provided.",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Confirm the token was issued for admin role
    if (decoded.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Insufficient privileges.",
      });
    }

    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token. Please log in again.",
    });
  }
};

module.exports = { adminAuth };
