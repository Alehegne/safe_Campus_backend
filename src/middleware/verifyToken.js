const jwt = require("jsonwebtoken");
const sendResponse = require("../utils/sendResponse");

module.exports = (req, res, next) => {
  console.log("Verifying token...");
  const authHeader = req.headers.authorization;
  console.log("Authorization Header:", authHeader);
  // console.log("authHeader checking:", authHeader);
  if (!authHeader || !authHeader?.startsWith("Bearer ")) {
    console.log("No token provided");
    return sendResponse(res, 401, false, "Unauthorized", "Invalid token");
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return sendResponse(res, 401, false, "Unauthorized", {}, err);

    req.user = decoded;
    console.log("verified::");
    next();
  });
};
