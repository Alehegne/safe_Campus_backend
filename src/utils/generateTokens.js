const jwt = require("jsonwebtoken");

const RESPONSE_SECRET = process.env.RESPONSE_TOKEN_SECRET;

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
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 24 * 24, // 24 days expiry
  };

  return jwt.sign(payload, RESPONSE_SECRET);
}

function generateTrackingToken(email, eventId, role = "student", name = "") {
  const payload = {
    email,
    type: "emailOpen",
    eventId,
    role,
    name,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 24 * 24, // 24 days expiry
  };

  return jwt.sign(payload, RESPONSE_SECRET);
}

function getAdminTokens(userPayload, user) {}
function getGuardTokens(userPayload, user) {
  const trackingToken = generateTrackingToken(
    user.email,
    userPayload.user.panicEventId,
    user.role,
    user.fullName
  );
}

module.exports = {
  generateResponseToken,
  generateTrackingToken,
  getAdminTokens,
  getGuardTokens,
};
