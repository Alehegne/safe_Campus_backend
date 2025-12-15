const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { sendNotification } = require("../services/sendNotification");

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
  if (typeof email !== "string") return false;
  const s = email.trim();
  return EMAIL_RE.test(s);
}

// // usage
// console.log(isValidEmail('user@example.com')); // true
// console.log(isValidEmail('user+tag@sub.domain.co')); // true
// console.log(isValidEmail('bad@@example.com')); // false

async function sendNotificationToUserWithDeviceToken(
  email,
  help_need,
  coordinates
) {
  // Lookup user by email to get device token
  const User = require("../models/user.model");
  const user = await User.findOne({ email: email });
  if (user && user.deviceToken) {
    // Send notification
    await sendNotification(
      user.deviceToken,
      "Location Shared",
      `${
        (help_need && help_need.fullName) || `Your Friend`
      } has shared their current location with you. Please check your email for details.`,
      {}
    );
  }
}

function getEmailInfo(user, coordinates) {
  const emailInfo = {
    subject: `${
      user.fullName || `User ${user.userId}`
    } is requesting your assistance`,
    text: `
        Hello,

        ${
          user.fullName || `User ${user.userId}`
        } has shared their current location with you and is requesting your assistance.

        Location Details:
        Latitude: ${coordinates[1]}
        Longitude: ${coordinates[0]}

        Google Maps:
        https://www.google.com/maps?q=${coordinates[1]},${coordinates[0]}

        Please respond as soon as possible.

        Regards,
        Safety Support System
          `.trim(),

    html: `
            <p>Hello,</p>

            <p>
              <strong>${
                user.fullName || `User ${user.userId}`
              }</strong> has shared their current location with you
              and is requesting your assistance.
            </p>

            <p><strong>Location Details:</strong></p>
            <ul>
              <li><strong>Latitude:</strong> ${coordinates[1]}</li>
              <li><strong>Longitude:</strong> ${coordinates[0]}</li>
            </ul>

            <p>
              <strong>View on Google Maps:</strong><br />
              <a href="https://www.google.com/maps?q=${coordinates[1]},${
      coordinates[0]
    }" target="_blank">
                Open Location in Google Maps
              </a>
            </p>

            <p>
              Please take the necessary action as soon as possible.
            </p>

            <p>
              Regards,<br />
              <strong>Safety Support System</strong>
            </p>
          `,
  };
  return emailInfo;
}

module.exports = {
  generateJwtToken,
  comparePassword,
  decodeJwtToken,
  getGoogleMapURL,
  decodeToken,
  getTrackingImage,
  isValidEmail,
  sendNotificationToUserWithDeviceToken,
  getEmailInfo,
};
