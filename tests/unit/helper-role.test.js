jest.mock("firebase-admin", () => ({
  initializeApp: jest.fn(),
  credential: {
    cert: jest.fn(),
  },
  messaging: jest.fn(),
}));

jest.mock("../../src/services/auth.service", () => ({
  findUserById: jest.fn(),
  findAdminAndSecurity: jest.fn(),
}));

jest.mock("../../src/utils/sendToTrustedContacts", () => jest.fn());
jest.mock("../../src/utils/sendToAdminAndSecurity", () => jest.fn());
jest.mock("../../src/config/socket.config", () => ({
  getIO: jest.fn(() => ({ to: jest.fn() })),
}));

const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const verifyToken = require("../../src/middleware/verifyToken");
const { comparePassword, generateJwtToken } = require("../../src/utils/helper");
const roleMiddleware = require("../../src/middleware/role.middleware");
const { sendPanic } = require("../../src/services/panicAlert.service");
const authService = require("../../src/services/auth.service");
const sendAlertToTrustedContacts = require("../../src/utils/sendToTrustedContacts");
const sendAlertToAdminAndSecurity = require("../../src/utils/sendToAdminAndSecurity");
const { getIO } = require("../../src/config/socket.config");

describe("jwt helpers", () => {
  it("generates a token that verifies with the configured secret", () => {
    const payload = {
      userId: "abc123",
      email: "user@campus.edu",
      role: "student",
    };
    const token = generateJwtToken(payload);

    expect(typeof token).toBe("string");
    expect(jwt.verify(token, process.env.JWT_SECRET)).toMatchObject(payload);
  });

  it("compares plain passwords against bcrypt hashes", async () => {
    const hash = await bcrypt.hash("password123", 12);
    const result = await comparePassword(hash, "password123");

    expect(result).toBe(true);
  });
});

describe("verifyToken", () => {
  it("rejects malformed JWTs", () => {
    const req = { headers: { authorization: "Bearer not.valid.jwt" } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    verifyToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});

describe("roleMiddleware", () => {
  it("allows a user when their role is permitted", () => {
    const req = { user: { role: "admin" } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    roleMiddleware("admin", "campus_security")(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it("denies a user when their role is not permitted", () => {
    const req = { user: { role: "student" } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    roleMiddleware("admin", "campus_security")(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("denies a request when the auth context is missing", () => {
    const req = {};
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    roleMiddleware("admin")(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});

describe("sendPanic", () => {
  beforeEach(() => {
    global.onlineUsers = {};
    jest.clearAllMocks();
  });

  it("builds a valid payload and dispatches alerts to trusted contacts and admins", async () => {
    authService.findUserById.mockResolvedValue({
      _id: "user-1",
      fullName: "Alice Student",
      studentId: "S1001",
      email: "alice@campus.edu",
      role: "student",
      trustedContacts: [{ email: "friend@campus.edu", name: "Friend" }],
    });
    authService.findAdminAndSecurity.mockResolvedValue([
      { _id: "admin-1", email: "guard@campus.edu", role: "campus_security" },
    ]);

    await sendPanic(
      "user-1",
      { coordinates: [36.2, 7.1], address: "Library" },
      "panic-123",
    );

    expect(getIO).toHaveBeenCalledTimes(1);
    expect(sendAlertToTrustedContacts).toHaveBeenCalledWith(
      [{ email: "friend@campus.edu", name: "Friend" }],
      expect.objectContaining({
        eventType: "panicEvent",
        user: expect.objectContaining({
          fullName: "Alice Student",
          studentId: "S1001",
          email: "alice@campus.edu",
          panicEventId: "panic-123",
          location: expect.objectContaining({
            coordinates: [36.2, 7.1],
            name: "Library",
          }),
        }),
      }),
      expect.any(Object),
      global.onlineUsers,
    );
    expect(sendAlertToAdminAndSecurity).toHaveBeenCalledWith(
      [{ _id: "admin-1", email: "guard@campus.edu", role: "campus_security" }],
      expect.any(Object),
      expect.any(Object),
      global.onlineUsers,
    );
  });
});
