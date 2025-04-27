global.onlineUsers = {
  // key:userId, value:socketId
};
const addOnlineUser = (userId, socketId) => {
  global.onlineUsers[userId] = socketId;
  console.log("onlineUsers", global.onlineUsers);
};
const removeOnlineUser = (socketId) => {
  // Remove the user from the online users list when they disconnect
  const userId = Object.keys(global.onlineUsers).find(
    (key) => global.onlineUsers[key] === socketId
  );
  if (userId) {
    delete global.onlineUsers[userId];
    console.log("User disconnected:", userId);
  }
  console.log("Online:", global.onlineUsers);
};
const getOnlineUser = (userId) => {
  return global.onlineUsers[userId];
};
const getAllOnlineUsers = () => {
  return global.onlineUsers;
};
module.exports = {
  addOnlineUser,
  removeOnlineUser,
  getOnlineUser,
  getAllOnlineUsers,
};
