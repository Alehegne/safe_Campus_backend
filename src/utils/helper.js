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
function decodeToken(token, secret) {
  return jwt.verify(token, secret, (err, decoded) => {
    if (err) return null;
    return decoded;
  });
}

function getGoogleMapURL(lat, lng) {
  return `https://maps.google.com/?q=${lat},${lng}`;
}

module.exports = {
  generateJwtToken,
  comparePassword,
  decodeJwtToken,
  getGoogleMapURL,
  decodeToken,
};
