const User = require("../models/user.model");

async function profileData(userId) {
  const user = await User.findById(userId).select("-password -__v");
  return user;
}
async function updateUser(userId, updateData) {
  const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
    new: true,
    runValidators: true,
  }).select("-password -__v");
  return updatedUser;
}

async function deleteUser(userId) {
  const deletedUser = await User.findByIdAndDelete(userId).select(
    "-password -__v"
  );
  return deletedUser;
}

module.exports = {
  profileData,
  updateUser,
  deleteUser,
};
