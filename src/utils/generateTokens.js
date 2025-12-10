const jwt = require("jsonwebtoken");

const RESPONSE_SECRET = process.env.RESPONSE_TOKEN_SECRET;

// 1 DAY EXPIRY
const ONE_DAY = "1d";

function generateResponseToken(
  email,
  eventId,
  response,
  role = "student",
  name = ""
) {
  const payload = {
    email,
    response,
    eventId,
    role,
    name,
    type: "response",
  };

  return jwt.sign(payload, RESPONSE_SECRET, { expiresIn: ONE_DAY });
}

function generateTrackingToken(email, eventId, role = "student", name = "") {
  const payload = {
    email,
    type: "emailOpen",
    eventId,
    role,
    name,
  };

  return jwt.sign(payload, RESPONSE_SECRET, { expiresIn: ONE_DAY });
}

function getAdminTokens(userPayload, user) {
  // Add later if needed
}

function getGuardTokens(userPayload, user) {
  const trackingToken = generateTrackingToken(
    user.email,
    userPayload.user.panicEventId,
    user.role,
    user.fullName
  );

  return { trackingToken };
}

module.exports = {
  generateResponseToken,
  generateTrackingToken,
  getAdminTokens,
  getGuardTokens,
};
