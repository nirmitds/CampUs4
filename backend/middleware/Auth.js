const jwt = require("jsonwebtoken");

function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  // Guard against null/undefined/object injection
  if (!token || token === "null" || token === "undefined" || typeof token !== "string") {
    return res.status(401).json({ message: "Invalid token" });
  }

  // Basic JWT format check (3 base64url segments)
  if (!/^[\w-]+\.[\w-]+\.[\w-]+$/.test(token)) {
    return res.status(401).json({ message: "Malformed token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"], // only allow HS256 — prevents algorithm confusion attacks
    });

    // Ensure required fields exist
    if (!decoded.id || !decoded.username) {
      return res.status(401).json({ message: "Invalid token payload" });
    }

    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired. Please log in again." });
    }
    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid token" });
    }
    return res.status(401).json({ message: "Authentication failed" });
  }
}

module.exports = { verifyToken };
