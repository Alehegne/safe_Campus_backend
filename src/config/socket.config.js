const { Server } = require("socket.io");
const initSosSocket = require("../sockets/sos.socket");
const socketAuth = require("../sockets/middleware/socket.auth");
const {
  addOnlineUser,
  removeOnlineUser,
  getAllOnlineUsers,
} = require("../sockets/onlineUser");

let ioInstance;

/**
 * Initialize Socket.IO server
 * @param {http.Server} server - HTTP/S server
 */
function initSocket(server) {
  try {
    const io = new Server(server, {
      cors: {
        origin: "*", // adjust to your frontend domain in production
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      },
      transports: ["websocket", "polling"],
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    // Attach authentication middleware
    io.use(socketAuth);

    // Connection handler
    io.on("connection", (socket) => {
      console.log(`Socket connected: ${socket.id}`, socket.user);

      // Register user online
      socket.on("register_online", (userId) => {
        addOnlineUser(userId, socket.id);
        console.log("Online users after registration:", getAllOnlineUsers());
      });

      // Remove user from online list
      socket.on("remove_online", (userId) => {
        removeOnlineUser(userId, socket.id);
        console.log("Online users after removal:", getAllOnlineUsers());
      });

      //check wether the user is online or not
      socket.on("check_online", (userId, callback) => {
        const onlineUsers = getAllOnlineUsers();
        const isOnline = onlineUsers.some((user) => user.userId === userId);
        callback(isOnline);
      });

      // Handle disconnection
      socket.on("disconnect", (reason) => {
        console.log(`Socket disconnected: ${socket.id}, reason: ${reason}`);
        removeOnlineUser(socket.id);
        console.log("Online users after disconnection:", getAllOnlineUsers());
      });

      // Handle socket errors
      socket.on("error", (error) => {
        console.error(`Socket error [${socket.id}]:`, error);
      });
    });

    // Global connection errors
    io.engine.on("connection_error", (err) => {
      console.error("Socket engine connection error:", {
        code: err.code,
        message: err.message,
        req: err.req,
        context: err.context,
      });
    });

    // Initialize your app-specific sockets
    initSosSocket(io);

    ioInstance = io;
    console.log("Socket.IO server initialized successfully");
  } catch (error) {
    console.error("Failed to initialize Socket.IO server:", error);
    throw error;
  }
}

/**
 * Get the initialized Socket.IO instance
 */
function getIO() {
  if (!ioInstance) throw new Error("Socket.IO not initialized");
  return ioInstance;
}

module.exports = { initSocket, getIO };
