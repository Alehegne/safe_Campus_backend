jest.mock("firebase-admin", () => ({
  initializeApp: jest.fn(),
  credential: {
    cert: jest.fn(),
  },
  messaging: jest.fn(),
}));

const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const jwt = require("jsonwebtoken");

jest.mock("../../src/config/multer", () => {
  const multer = require("multer");
  return multer();
});

jest.mock("../../src/utils/uploadImage", () =>
  jest.fn(async () => "https://example.com/uploaded.jpg"),
);

const app = require("../../src/app");
const User = require("../../src/models/user.model");
const Incident = require("../../src/models/incidentModel");

describe("authentication and reporting", () => {
  let mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri(), {
      dbName: "safe-campus-tests",
    });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Incident.deleteMany({});
  });

  it("registers a valid student user", async () => {
    const payload = {
      studentId: "S1001",
      email: "student@campus.edu",
      password: "secure123",
      fullName: "Alice Student",
      role: "student",
    };

    const response = await request(app)
      .post("/api/auth/register")
      .send(payload);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.email).toBe("student@campus.edu");
  });

  it("rejects invalid registration data", async () => {
    const response = await request(app).post("/api/auth/register").send({
      email: "bad-email",
      password: "123",
      fullName: "Alice Student",
      role: "student",
    });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(await User.countDocuments()).toBe(0);
  });

  it("rejects duplicate student registration", async () => {
    const payload = {
      studentId: "S1001",
      email: "student@campus.edu",
      password: "secure123",
      fullName: "Alice Student",
      role: "student",
    };

    await request(app).post("/api/auth/register").send(payload);
    const response = await request(app)
      .post("/api/auth/register")
      .send(payload);

    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/already exists/i);
  });

  it("rejects access to a protected route without a token", async () => {
    const response = await request(app).get("/api/report");

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  it("rejects malformed JWTs on protected routes", async () => {
    const response = await request(app)
      .get("/api/report")
      .set("Authorization", "Bearer invalid.jwt.token");

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  it("rejects expired JWTs on protected routes", async () => {
    const expiredToken = jwt.sign(
      { userId: "expired-user", email: "student@campus.edu", role: "student" },
      process.env.JWT_SECRET,
      { expiresIn: "-1h" },
    );

    const response = await request(app)
      .get("/api/report")
      .set("Authorization", `Bearer ${expiredToken}`);

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  it("denies student access to admin-only reports", async () => {
    const user = await User.create({
      studentId: "S1002",
      email: "student@campus.edu",
      password: "secure123",
      fullName: "Student User",
      role: "student",
    });

    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
    );

    const response = await request(app)
      .get("/api/report")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(403);
    expect(response.body.message).toMatch(
      /forbidden|insufficient permissions/i,
    );
    expect(await Incident.countDocuments()).toBe(0);
  });

  it("allows admin users to list reports", async () => {
    const admin = await User.create({
      email: "admin@campus.edu",
      password: "secure123",
      fullName: "Admin User",
      role: "admin",
    });

    await Incident.create({
      description: "Library issue",
      location: { type: "Point", coordinates: [38.0, 7.0] },
      tag: "harassment",
      status: "pending",
    });

    const token = jwt.sign(
      { userId: admin._id.toString(), email: admin.email, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
    );

    const response = await request(app)
      .get("/api/report")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.reports.length).toBeGreaterThan(0);
  });

  it("logs in a valid user and returns a sanitized session payload", async () => {
    const user = await User.create({
      studentId: "S1003",
      email: "login@campus.edu",
      password: "secure123",
      fullName: "Login User",
      role: "student",
    });

    const response = await request(app).post("/api/auth/login").send({
      email: "login@campus.edu",
      password: "secure123",
    });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.token).toEqual(expect.any(String));
    expect(response.body.data.refreshToken).toEqual(expect.any(String));
    expect(response.body.data.user.email).toBe(user.email);
    expect(response.body.data.user.password).toBeUndefined();
    expect(JSON.stringify(response.body)).not.toContain("secure123");
    expect(JSON.stringify(response.body)).not.toContain(user.password);
  });

  it("rejects a login request for a nonexistent user", async () => {
    const response = await request(app).post("/api/auth/login").send({
      email: "missing@campus.edu",
      password: "secure123",
    });

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toMatch(/register/i);
  });

  it("rejects login requests with missing credentials", async () => {
    const response = await request(app).post("/api/auth/login").send({
      email: "login@campus.edu",
    });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toMatch(/email and password|provide/i);
  });

  it("rejects login with an incorrect password without leaking secrets", async () => {
    const user = await User.create({
      studentId: "S1004",
      email: "wrongpass@campus.edu",
      password: "secure123",
      fullName: "Wrong Password User",
      role: "student",
    });

    const response = await request(app).post("/api/auth/login").send({
      email: "wrongpass@campus.edu",
      password: "wrongpassword",
    });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toMatch(/correct password/i);
    expect(JSON.stringify(response.body)).not.toContain(user.password);
    expect(JSON.stringify(response.body)).not.toContain("secure123");
  });

  it("returns a server error when the database lookup fails during login", async () => {
    const findSpy = jest
      .spyOn(User, "find")
      .mockRejectedValueOnce(new Error("DB unavailable"));

    const response = await request(app).post("/api/auth/login").send({
      email: "login@campus.edu",
      password: "secure123",
    });

    expect(response.status).toBe(500);
    expect(response.body.message).toBe("Server error");
    findSpy.mockRestore();
  });

  it("returns a server error when JWT generation fails during login", async () => {
    await User.create({
      studentId: "S1005",
      email: "tokenfail@campus.edu",
      password: "secure123",
      fullName: "Token Failure User",
      role: "student",
    });

    const signSpy = jest.spyOn(jwt, "sign").mockImplementation(() => {
      throw new Error("JWT generation failed");
    });

    const response = await request(app).post("/api/auth/login").send({
      email: "tokenfail@campus.edu",
      password: "secure123",
    });

    expect(response.status).toBe(500);
    expect(response.body.message).toBe("Server error");
    signSpy.mockRestore();
  });

  it("rejects report creation when the location payload is invalid", async () => {
    const user = await User.create({
      studentId: "S1004",
      email: "reporter@campus.edu",
      password: "secure123",
      fullName: "Reporter Student",
      role: "student",
    });

    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
    );

    const response = await request(app)
      .post("/api/report")
      .set("Authorization", `Bearer ${token}`)
      .field("description", "Unsafe area near library")
      .field("tag", "harassment")
      .field("anonymous", "false")
      .field("location", JSON.stringify({ coordinates: [38.0] }))
      .attach("image", Buffer.from("fake-image-content"), {
        filename: "report.png",
        contentType: "image/png",
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(await Incident.countDocuments()).toBe(0);
  });

  it("creates an incident for an authenticated user", async () => {
    const user = await User.create({
      studentId: "S1002",
      email: "reporter@campus.edu",
      password: "secure123",
      fullName: "Reporter Student",
      role: "student",
    });

    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
    );

    const response = await request(app)
      .post("/api/report")
      .set("Authorization", `Bearer ${token}`)
      .field("description", "Unsafe area near library")
      .field("tag", "harassment")
      .field("anonymous", "false")
      .field("location", JSON.stringify({ coordinates: [38.0, 7.0] }))
      .attach("image", Buffer.from("fake-image-content"), {
        filename: "report.png",
        contentType: "image/png",
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toMatch(/incident reported/i);

    const created = await Incident.findOne({
      description: "Unsafe area near library",
    });
    expect(created).not.toBeNull();
    expect(created.location.coordinates).toEqual([38.0, 7.0]);
    expect(created.location.type).toBe("Point");
  });
});
