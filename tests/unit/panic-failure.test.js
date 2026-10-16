jest.mock("firebase-admin", () => ({
  initializeApp: jest.fn(),
  credential: {
    cert: jest.fn(),
  },
  messaging: jest.fn(),
}));

jest.mock("../../src/services/auth.service", () => ({
  findWithEmail: jest.fn(),
}));

jest.mock("../../src/utils/sendEmail", () => jest.fn());
jest.mock("../../src/services/sendNotification", () => ({
  sendNotification: jest.fn(),
}));

const sendAlertToAdminAndSecurity = require("../../src/utils/sendToAdminAndSecurity");
const sendAlertToTrustedContacts = require("../../src/utils/sendToTrustedContacts");
const sendEmail = require("../../src/utils/sendEmail");
const authService = require("../../src/services/auth.service");
const { sendNotification } = require("../../src/services/sendNotification");

describe("panic notification failure handling", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("keeps notifying the remaining admins if one admin email send fails", async () => {
    const userPayload = {
      eventType: "panicEvent",
      user: {
        fullName: "Alice Student",
        studentId: "S1001",
        email: "alice@campus.edu",
        panicEventId: "panic-123",
        location: {
          coordinates: [36.2, 7.1],
          name: "Library",
          mapUrl: "https://maps.google.com/?q=7.1,36.2",
        },
      },
    };

    sendEmail
      .mockRejectedValueOnce(new Error("mail failed"))
      .mockResolvedValueOnce({});

    await expect(
      sendAlertToAdminAndSecurity(
        [
          { _id: { toString: () => "admin-1" }, email: "first@campus.edu" },
          { _id: { toString: () => "admin-2" }, email: "second@campus.edu" },
        ],
        userPayload,
        { to: jest.fn() },
        {},
      ),
    ).resolves.toBeUndefined();

    expect(sendEmail).toHaveBeenCalledTimes(2);
  });

  it("continues to the next trusted contact when one email send fails", async () => {
    const payload = {
      eventType: "panicEvent",
      user: {
        fullName: "Alice Student",
        studentId: "S1001",
        email: "alice@campus.edu",
        panicEventId: "panic-123",
        location: {
          coordinates: [36.2, 7.1],
          name: "Library",
          mapUrl: "https://maps.google.com/?q=7.1,36.2",
        },
      },
    };

    authService.findWithEmail
      .mockResolvedValueOnce([{ role: "trustedContact" }])
      .mockResolvedValueOnce([
        { role: "trustedContact", deviceToken: "token-2" },
      ]);

    sendEmail
      .mockRejectedValueOnce(new Error("first contact email failed"))
      .mockResolvedValueOnce({});

    await expect(
      sendAlertToTrustedContacts(
        [
          { email: "first@campus.edu", name: "Friend One" },
          { email: "second@campus.edu", name: "Friend Two" },
        ],
        payload,
        { to: jest.fn() },
        {},
      ),
    ).resolves.toBeUndefined();

    expect(sendEmail).toHaveBeenCalledTimes(2);
    expect(sendNotification).toHaveBeenCalledTimes(1);
  });

  it("continues processing later trusted contacts when one push notification fails", async () => {
    const payload = {
      eventType: "panicEvent",
      user: {
        fullName: "Alice Student",
        studentId: "S1001",
        email: "alice@campus.edu",
        panicEventId: "panic-123",
        location: {
          coordinates: [36.2, 7.1],
          name: "Library",
          mapUrl: "https://maps.google.com/?q=7.1,36.2",
        },
      },
    };

    authService.findWithEmail
      .mockResolvedValueOnce([
        { role: "trustedContact", deviceToken: "token-1" },
      ])
      .mockResolvedValueOnce([
        { role: "trustedContact", deviceToken: "token-2" },
      ]);

    sendEmail.mockResolvedValue({});
    sendNotification
      .mockRejectedValueOnce(new Error("push failed for first contact"))
      .mockResolvedValueOnce({});

    await expect(
      sendAlertToTrustedContacts(
        [
          { email: "first@campus.edu", name: "Friend One" },
          { email: "second@campus.edu", name: "Friend Two" },
        ],
        payload,
        { to: jest.fn() },
        {},
      ),
    ).resolves.toBeUndefined();

    expect(sendNotification).toHaveBeenCalledTimes(2);
    expect(sendNotification.mock.calls.map(([token]) => token)).toEqual([
      "token-1",
      "token-2",
    ]);
    expect(sendEmail).toHaveBeenCalledTimes(2);
  });
});
