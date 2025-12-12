const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

function generateJwtToken(payload) {
  console.log("JWT EXPIRATION:", process.env.JWT_EXPIRATION);

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

function getTrackingImage() {
  return Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAwAB/gbLbfsAAAAASUVORK5CYII=",
    "base64"
  );
}

const EMAIL_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

function isValidEmail(email) {
  if (typeof email !== 'string') return false;
  const s = email.trim();
  return EMAIL_RE.test(s);
}

// // usage
// console.log(isValidEmail('user@example.com')); // true
// console.log(isValidEmail('user+tag@sub.domain.co')); // true
// console.log(isValidEmail('bad@@example.com')); // false


module.exports = {
  generateJwtToken,
  comparePassword,
  decodeJwtToken,
  getGoogleMapURL,
  decodeToken,
  getTrackingImage,
  isValidEmail
};
