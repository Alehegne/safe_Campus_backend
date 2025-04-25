const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

function generateJwtToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRATION,
  });
}
async function comparePassword(hashed, candidate) {
  return await bcrypt.compare(candidate, hashed);
}

function decodeJwtToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return null;
    return decoded;
  });
}

module.exports = {
  generateJwtToken,
  comparePassword,
  decodeJwtToken,
};
