// src/sockets/sos.socket.js

module.exports = function initSOSSocket(io) {
  const sosNamespace = io.of("/sos");

  sosNamespace.on("connection", (socket) => {
    console.log("client connected:", socket.id);

    // USER JOINS SOS ROOM
    socket.on("join_channel", ({ sosSessionId, isAdmin }) => {
      socket.join(sosSessionId);

      console.log(`${socket.id} joined SOS room: ${sosSessionId}`);

      // Notify admins if a user joins
      if (!isAdmin) {
        socket.to(sosSessionId).emit("victim_joined", {
          socketId: socket.id,
          time: new Date(),
        });
      }
    });

    // USER SENDS LIVE LOCATION
    socket.on("send_location", ({ sosSessionId, location }) => {
      // forward to admins
      socket.to(sosSessionId).emit("location_update", {
        userId: socket.id,
        location,
        timestamp: new Date(),
      });
    });

    // USER LEAVES SOS ROOM
    socket.on("leave_channel", ({ sosSessionId }) => {
      socket.leave(sosSessionId);

      socket.to(sosSessionId).emit("victim_left", {
        socketId: socket.id,
      });
    });

    socket.on("disconnect", () => {
      console.log("SOS client disconnected:", socket.id);
    });
  });
};
