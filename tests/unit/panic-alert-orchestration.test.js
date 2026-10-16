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

const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const authService = require("../../src/services/auth.service");
const User = require("../../src/models/user.model");
const PanicEvent = require("../../src/models/panicEvent.model");
const {
  savePanicEvent,
  sendPanic,
} = require("../../src/services/panicAlert.service");
const sendAlertToTrustedContacts = require("../../src/utils/sendToTrustedContacts");
const sendAlertToAdminAndSecurity = require("../../src/utils/sendToAdminAndSecurity");

describe("panic alert orchestration", () => {
  let mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri(), {
      dbName: "safe-campus-panic-orchestration-tests",
    });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    global.onlineUsers = {};
    await User.deleteMany({});
    await PanicEvent.deleteMany({});
  });

  afterEach(() => {
    delete global.onlineUsers;
  });

  it("persists a panic event and dispatches it to trusted contacts and admin recipients", async () => {
    const user = await User.create({
      studentId: "P1001",
      email: "panic@campus.edu",
      password: "secure123",
      fullName: "Panic User",
      role: "student",
      trustedContacts: [
        { email: "friend@campus.edu", name: "Friend", phone: "123" },
      ],
    });

    const admin = await User.create({
      email: "guard@campus.edu",
      password: "secure123",
      fullName: "Guard User",
      role: "campus_security",
    });

    authService.findUserById.mockResolvedValue(user);
    authService.findAdminAndSecurity.mockResolvedValue([admin]);

    const event = await savePanicEvent({
      userId: user._id,
      location: {
        type: "Point",
        coordinates: [36.2, 7.1],
      },
    });

    await sendPanic(
      user._id,
      { coordinates: [36.2, 7.1], address: "Library" },
      event._id,
    );

    const savedEvent = await PanicEvent.findById(event._id);
    expect(savedEvent).not.toBeNull();
    expect(savedEvent.location.coordinates).toEqual([36.2, 7.1]);
    expect(sendAlertToTrustedContacts).toHaveBeenCalledWith(
      user.trustedContacts,
      expect.objectContaining({
        eventType: "panicEvent",
        user: expect.objectContaining({
          email: user.email,
          studentId: user.studentId,
        }),
      }),
      expect.any(Object),
      global.onlineUsers,
    );
    expect(sendAlertToAdminAndSecurity).toHaveBeenCalledWith(
      [admin],
      expect.any(Object),
      expect.any(Object),
      global.onlineUsers,
    );
  });

  it("resolves cleanly when there are no eligible trusted contacts or admins", async () => {
    const user = await User.create({
      studentId: "P1002",
      email: "empty@campus.edu",
      password: "secure123",
      fullName: "Empty Panic User",
      role: "student",
      trustedContacts: [],
    });

    authService.findUserById.mockResolvedValue(user);
    authService.findAdminAndSecurity.mockResolvedValue([]);

    const event = await savePanicEvent({
      userId: user._id,
      location: {
        type: "Point",
        coordinates: [36.1, 7.2],
      },
    });

    await expect(
      sendPanic(
        user._id,
        { coordinates: [36.1, 7.2], address: "Dorm" },
        event._id,
      ),
    ).resolves.toBeUndefined();

    expect(sendAlertToTrustedContacts).toHaveBeenCalledWith(
      [],
      expect.any(Object),
      expect.any(Object),
      global.onlineUsers,
    );
    expect(sendAlertToAdminAndSecurity).toHaveBeenCalledWith(
      [],
      expect.any(Object),
      expect.any(Object),
      global.onlineUsers,
    );
  });

  it("rejects invalid panic alert payloads before dispatching notifications", async () => {
    const user = await User.create({
      studentId: "P1003",
      email: "invalid@campus.edu",
      password: "secure123",
      fullName: "Invalid Panic User",
      role: "student",
    });

    authService.findUserById.mockResolvedValue(user);

    await expect(
      sendPanic(user._id, { coordinates: [7.1] }, "panic-123"),
    ).rejects.toThrow("Invalid coordinates provided!");

    expect(sendAlertToTrustedContacts).not.toHaveBeenCalled();
    expect(sendAlertToAdminAndSecurity).not.toHaveBeenCalled();
  });

  it("surfaces persistence failures when panic event storage fails", async () => {
    const saveSpy = jest
      .spyOn(PanicEvent.prototype, "save")
      .mockRejectedValueOnce(new Error("Database save failed"));

    await expect(
      savePanicEvent({
        userId: new mongoose.Types.ObjectId(),
        location: { type: "Point", coordinates: [36.2, 7.1] },
      }),
    ).rejects.toThrow("Database save failed");

    saveSpy.mockRestore();
  });

  it("propagates notification-provider failure after a panic event is created", async () => {
    const user = await User.create({
      studentId: "P1004",
      email: "notifyfail@campus.edu",
      password: "secure123",
      fullName: "Notify Fail User",
      role: "student",
      trustedContacts: [
        { email: "friend@campus.edu", name: "Friend", phone: "123" },
      ],
    });

    authService.findUserById.mockResolvedValue(user);
    authService.findAdminAndSecurity.mockResolvedValue([]);
    sendAlertToTrustedContacts.mockRejectedValueOnce(
      new Error("Notification provider failed"),
    );

    const event = await savePanicEvent({
      userId: user._id,
      location: {
        type: "Point",
        coordinates: [36.2, 7.1],
      },
    });

    await expect(
      sendPanic(
        user._id,
        { coordinates: [36.2, 7.1], address: "Library" },
        event._id,
      ),
    ).rejects.toThrow("Notification provider failed");
  });
});
