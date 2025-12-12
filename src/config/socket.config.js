// src/config/socket.js
const { Server } = require("socket.io");
const initSosSocket = require("../sockets/sos.socket");

let ioInstance;

function initSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
    transports: ["websocket", "polling"],
  });

  //Global error handling
  io.engine.on("connection_error", (err) => {
    console.error("Socket connection error:", {
      code: err.code,
      message: err.message,
      req: err.req,
      context: err.context,
    });
  });

  console.log("⚡ Socket.IO initialized");

  // Initialize all socket modules
  initSosSocket(io);

  ioInstance = io;
}

function getIO() {
  if (!ioInstance) throw new Error("Socket not initialized!");
  return ioInstance;
}

module.exports = { initSocket, getIO };

// /*
// # initialize socket.io server
// # then expose the io instance to be used in other file,
// #and initialize socket events
// */

// const { Server } = require("socket.io");
// const initSocketEvents = require("../sockets/index");

// let ioInstance;

// function initSocket(server) {
//   try {
//     // Parse allowed origins from environment variable
//     // const allowedOrigins = process.env.ALLOWEDORIGINS
//     //   ? process.env.ALLOWEDORIGINS.split(',')
//     //   : ['http://localhost:3000'];

//     const io = new Server(server, {
//       cors: {
//         origin: "*",
//         methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
//         credentials: true,
//       },
//       // Connection settings
//       pingTimeout: 60000, // 60 seconds
//       pingInterval: 25000, // 25 seconds
//       connectTimeout: 45000, // 45 seconds
//       transports: ["websocket", "polling"],
//     });

//     console.log("Socket.io server instance created");
//     // Global error handling
//     io.engine.on("connection_error", (err) => {
//       console.error("Socket connection error:", {
//         code: err.code,
//         message: err.message,
//         req: err.req,
//         context: err.context,
//       });
//     });

//     // Initialize socket events first (this includes authentication middleware)
//     initSocketEvents(io);

//     // Create namespaces after middleware setup
//     const routeNamespace = io.of("/routes");

//     // Namespace error handling
//     routeNamespace.on("connection_error", (err) => {
//       console.error("Route namespace connection error:", err);
//     });

//     // Connection handling
//     io.on("connection", (socket) => {
//       console.log(
//         `Client connected - ID: ${socket.id}, IP: ${socket.handshake.address}`
//       );

//       // Handle reconnection
//       socket.on("reconnect", (attemptNumber) => {
//         console.log(
//           `Client reconnected - ID: ${socket.id}, Attempt: ${attemptNumber}`
//         );
//       });

//       // Handle disconnection
//       socket.on("disconnect", (reason) => {
//         console.log(
//           `Client disconnected - ID: ${socket.id}, Reason: ${reason}`
//         );
//       });

//       // Handle errors
//       socket.on("error", (error) => {
//         console.error(`Socket error for client ${socket.id}:`, error);
//       });
//     });

//     ioInstance = io;
//     console.log("Socket.io server initialized successfully");
//   } catch (error) {
//     console.error("Failed to initialize Socket.io server:", error);
//     throw error;
//   }
// }

// function getIO() {
//   if (!ioInstance) {
//     throw new Error("Socket.io not initialized");
//   }
//   return ioInstance;
// }

// module.exports = { initSocket, getIO };
