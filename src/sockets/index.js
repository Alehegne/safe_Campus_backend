const {
  addOnlineUser,
  getAllOnlineUsers,
  removeOnlineUser,
} = require("./onlineUser");

module.exports = function initSocketEvents(io) {
  io.on("connection", (socket) => {
    console.log("a client connected, client id:", socket.id);
    // Middleware for specific event
    // socket.use((packet, next) => {
    //   console.log("packet:", packet);
    //   if (packet[0] === "message") {
    //     const message = packet[1];
    //     if (message.length < 5) {
    //       return next(new Error("Message too short!"));
    //     }
    //   }
    //   next();
    // });

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
};
