// src/sockets/location.socket.js

module.exports = function initSosSocket(io) {
  const locationNamespace = io.of("/location_updates");

  locationNamespace.on("connection", (socket) => {
    console.log("Client connected to location namespace:", socket.id);

    // JOIN A CHANNEL/ROOM
    socket.on("join_channel", ({ channelId }) => {
      socket.join(channelId);
      console.log(`${socket.id} joined channel: ${channelId}`);

      // Notify others in that channel
      socket.to(channelId).emit("user_joined", {
        userId: socket.id,
        channelId,
      });
    });

    // LEAVE A CHANNEL/ROOM
    socket.on("leave_channel", ({ channelId }) => {
      socket.leave(channelId);
      console.log(` ${socket.id} left channel: ${channelId}`);

      socket.to(channelId).emit("user_left", {
        userId: socket.id,
        channelId,
      });
    });

    // RECEIVE LOCATION FROM USER AND EMIT TO CHANNEL
    socket.on("update_location", ({ channelId, location }) => {
      // emit to everyone in this channel EXCEPT the sender
      console.log(location);
      socket.to(channelId).emit("location_update", {
        userId: socket.id,
        location,
      });
    });

    // DISCONNECT LOG
    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });
};
