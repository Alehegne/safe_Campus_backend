const socketAuth = require("./middleware/socket.auth");
const initRouteSocket = require("./route.socket");
const {
  addOnlineUser,
  getAllOnlineUsers,
  removeOnlineUser,
} = require("./onlineUser");

function initSocketEvents(io) {
  // Global error handling middleware
  io.use((socket, next) => {
    socket.on("error", (error) => {
      console.error(`Socket error for client ${socket.id}:`, error);
      socket.emit("error", { message: "An error occurred" });
    });
    next();
  });

  // Apply authentication middleware first
  io.use(socketAuth);

  // Initialize route namespace after authentication
  const routeNamespace = io.of("/routes");

  // Apply authentication to route namespace
  routeNamespace.use(socketAuth);

  // Initialize route socket events
  initRouteSocket(routeNamespace);
 
  // Connection state tracking
  io.on("connection", (socket) => {
    const connectionTime = new Date();

    socket.on("disconnect", (reason) => {
      const duration = new Date() - connectionTime;
      console.log(
        `Client disconnected - ID: ${socket.id}, Duration: ${duration}ms, Reason: ${reason}`
      );
    });
    socket.on("register_online", (userId) => {
      addOnlineUser(userId, socket.id);
      socket.join(userId); // Join the user to their own room
    });

    socket.on("disconnect", () => {
      console.log("client disconnected", socket.id);
      // Remove the user from the online users list when they disconnect
      removeOnlineUser(socket.id);
    });
  });
}

module.exports = initSocketEvents;
