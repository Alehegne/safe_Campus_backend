// user model
const User = require("../models/user.model");
const sendResponse = require("../utils/sendResponse");
const getAllUsers = (req, res) => {
  // Fetch all users from the database
  User.find({})
    .select("-password -__v") // Exclude sensitive fields
    .then((users) => {
      sendResponse(res, 200, true, "Users retrieved successfully", users);
    })
    .catch((error) => {
      console.error("Error fetching users:", error);
      sendResponse(res, 500, false, "Server error", null, error.message);
    });
};

module.exports = {
  getAllUsers,
};
