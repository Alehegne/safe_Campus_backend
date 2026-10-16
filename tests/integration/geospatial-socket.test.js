jest.mock("firebase-admin", () => ({
  initializeApp: jest.fn(),
  credential: {
    cert: jest.fn(),
  },
  messaging: jest.fn(),
}));

const http = require("http");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const request = require("supertest");
const { MongoMemoryServer } = require("mongodb-memory-server");
const { io: Client } = require("socket.io-client");
const { Server } = require("socket.io");

const app = require("../../src/app");
const Incident = require("../../src/models/incidentModel");
const Route = require("../../src/models/route.model");
const User = require("../../src/models/user.model");
const initSocketEvents = require("../../src/sockets");

function waitForSocketEvent(socket, eventName) {
  return new Promise((resolve) => {
    socket.once(eventName, resolve);
  });
}

describe("geospatial incident queries", () => {
  let mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri(), {
      dbName: "safe-campus-geospatial-tests",
    });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await Incident.deleteMany({});
  });

  it("returns incidents inside the search radius", async () => {
    const user = await User.create({
      studentId: "G1001",
      email: "geo@campus.edu",
      password: "secure123",
      fullName: "Geo User",
      role: "student",
    });

    const nearIncident = await Incident.create({
      description: "Nearby hazard",
      location: { type: "Point", coordinates: [0.002, 0.005] },
      tag: "harassment",
      status: "pending",
      reporterId: user._id,
    });

    const farIncident = await Incident.create({
      description: "Far away hazard",
      location: { type: "Point", coordinates: [0.2, 0.2] },
      tag: "harassment",
      status: "pending",
      reporterId: user._id,
    });

    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
    );

    const response = await request(app)
      .get("/api/report/near")
      .query({ near: "0.005,0.002" })
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    const descriptions = response.body.data.map(
      (incident) => incident.description,
    );
    expect(descriptions).toContain(nearIncident.description);
    expect(descriptions).not.toContain(farIncident.description);
  });

  it("excludes incidents outside the configured 1km radius", async () => {
    const user = await User.create({
      studentId: "G1002",
      email: "geo2@campus.edu",
      password: "secure123",
      fullName: "Geo User 2",
      role: "student",
    });

    await Incident.create({
      description: "Outside radius",
      location: { type: "Point", coordinates: [0.02, 0.02] },
      tag: "harassment",
      status: "pending",
      reporterId: user._id,
    });

    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
    );

    const response = await request(app)
      .get("/api/report/near")
      .query({ near: "0.001,0.001" })
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toMatch(/no recent incidents/i);
  });

  it("uses longitude and latitude in the expected GeoJSON order", async () => {
    const user = await User.create({
      studentId: "G1003",
      email: "geo3@campus.edu",
      password: "secure123",
      fullName: "Geo User 3",
      role: "student",
    });

    const incident = await Incident.create({
      description: "GeoJSON order check",
      location: { type: "Point", coordinates: [0.002, 0.005] },
      tag: "harassment",
      status: "pending",
      reporterId: user._id,
    });

    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
    );

    const response = await request(app)
      .get("/api/report/near")
      .query({ near: "0.005,0.002" })
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data[0]._id.toString()).toBe(incident._id.toString());
    expect(response.body.data[0].location.coordinates).toEqual([0.002, 0.005]);
  });

  it("returns an empty result set when no incidents are within range", async () => {
    const user = await User.create({
      studentId: "G1004",
      email: "geo4@campus.edu",
      password: "secure123",
      fullName: "Geo User 4",
      role: "student",
    });

    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
    );

    const response = await request(app)
      .get("/api/report/near")
      .query({ near: "0.01,0.01" })
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.data).toBeNull();
  });

  it("rejects malformed or missing geospatial coordinates", async () => {
    const user = await User.create({
      studentId: "G1005",
      email: "geo5@campus.edu",
      password: "secure123",
      fullName: "Geo User 5",
      role: "student",
    });

    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
    );

    const missingResponse = await request(app)
      .get("/api/report/near")
      .set("Authorization", `Bearer ${token}`);

    const invalidResponse = await request(app)
      .get("/api/report/near")
      .query({ near: "invalid" })
      .set("Authorization", `Bearer ${token}`);

    expect(missingResponse.status).toBe(400);
    expect(invalidResponse.status).toBe(400);
    expect(missingResponse.body.message).toMatch(/coordinates not provided/i);
  });
});

describe("socket.io authorization and room behavior", () => {
  let mongoServer;
  let httpServer;
  let ioServer;
  let port;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri(), {
      dbName: "safe-campus-socket-tests",
    });

    httpServer = http.createServer();
    ioServer = new Server(httpServer, {
      transports: ["websocket", "polling"],
      cors: { origin: "*" },
    });

    initSocketEvents(ioServer);
    await new Promise((resolve) => httpServer.listen(0, resolve));
    port = httpServer.address().port;
    global.onlineUsers = {};
  });

  afterAll(async () => {
    await new Promise((resolve) => ioServer.close(() => resolve()));
    await new Promise((resolve) => httpServer.close(() => resolve()));
    await mongoose.disconnect();
    await mongoServer.stop();
    delete global.onlineUsers;
  });

  beforeEach(async () => {
    global.onlineUsers = {};
    await Route.deleteMany({});
  });

  it("allows a socket client with a valid JWT to connect", async () => {
    const token = jwt.sign(
      { userId: "socket-user-1", role: "student" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
    );
    const socket = Client(`http://localhost:${port}`, {
      transports: ["websocket"],
      auth: { token },
    });

    await waitForSocketEvent(socket, "connect");

    expect(socket.connected).toBe(true);
    socket.disconnect();
  });

  it("rejects a missing or malformed socket token", async () => {
    const socket = Client(`http://localhost:${port}`, {
      transports: ["websocket"],
      auth: { token: "bad-token" },
    });

    const err = await new Promise((resolve) => {
      socket.once("connect_error", resolve);
    });

    expect(err.message).toMatch(/authentication|token/i);
    socket.close();
  });

  it("lets the owner join route rooms and receive the confirmation event", async () => {
    const user = await User.create({
      studentId: "S2001",
      email: "owner@campus.edu",
      password: "secure123",
      fullName: "Route Owner",
      role: "student",
    });

    const route = await Route.create({
      userId: user._id,
      startLocation: { type: "Point", coordinates: [36.8, 7.1] },
      endLocation: { type: "Point", coordinates: [36.9, 7.2] },
      status: "started",
    });

    const token = jwt.sign(
      { userId: user._id.toString(), role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
    );

    const socket = Client(`http://localhost:${port}/routes`, {
      transports: ["websocket"],
      auth: { token },
    });

    await waitForSocketEvent(socket, "connect");
    const joined = new Promise((resolve) => {
      socket.once("route:joined", resolve);
    });

    socket.emit("route:join", route._id.toString());
    const event = await joined;

    expect(event.routeId).toBe(route._id.toString());
    expect(
      ioServer.of("/routes").adapter.rooms.get(`route:${route._id.toString()}`),
    ).toBeDefined();
    socket.disconnect();
  });

  it("rejects unauthorized route joins and does not add the client to the protected room", async () => {
    const owner = await User.create({
      studentId: "S2002",
      email: "owner2@campus.edu",
      password: "secure123",
      fullName: "Route Owner 2",
      role: "student",
    });

    const route = await Route.create({
      userId: owner._id,
      startLocation: { type: "Point", coordinates: [36.8, 7.1] },
      status: "started",
    });

    const attackerToken = jwt.sign(
      { userId: "different-user-id", role: "student" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
    );

    const socket = Client(`http://localhost:${port}/routes`, {
      transports: ["websocket"],
      auth: { token: attackerToken },
    });

    await waitForSocketEvent(socket, "connect");
    const errorEvent = new Promise((resolve) => {
      socket.once("error", resolve);
    });

    socket.emit("route:join", route._id.toString());
    const payload = await errorEvent;

    expect(payload.message).toMatch(/unauthorized|route/i);
    expect(
      ioServer.of("/routes").adapter.rooms.get(`route:${route._id.toString()}`),
    ).toBeUndefined();
    socket.disconnect();
  });

  it("broadcasts route location updates only to clients already joined to the route room", async () => {
    const user = await User.create({
      studentId: "S2003",
      email: "owner3@campus.edu",
      password: "secure123",
      fullName: "Route Owner 3",
      role: "student",
    });

    const route = await Route.create({
      userId: user._id,
      startLocation: { type: "Point", coordinates: [36.8, 7.1] },
      status: "started",
    });

    const token = jwt.sign(
      { userId: user._id.toString(), role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
    );

    const sender = Client(`http://localhost:${port}/routes`, {
      transports: ["websocket"],
      auth: { token },
    });
    const receiver = Client(`http://localhost:${port}/routes`, {
      transports: ["websocket"],
      auth: { token },
    });

    await waitForSocketEvent(sender, "connect");
    await waitForSocketEvent(receiver, "connect");

    const joinSender = new Promise((resolve) =>
      sender.once("route:joined", resolve),
    );
    sender.emit("route:join", route._id.toString());
    await joinSender;

    const joinReceiver = new Promise((resolve) =>
      receiver.once("route:joined", resolve),
    );
    receiver.emit("route:join", route._id.toString());
    await joinReceiver;

    const update = new Promise((resolve) =>
      receiver.once("route:location-updated", resolve),
    );
    sender.emit("route:location-update", {
      routeId: route._id.toString(),
      location: { coordinates: [36.81, 7.11] },
    });

    const payload = await update;
    expect(payload.routeId).toBe(route._id.toString());
    expect(payload.location.location.coordinates).toEqual([36.81, 7.11]);
    sender.disconnect();
    receiver.disconnect();
  });
});
