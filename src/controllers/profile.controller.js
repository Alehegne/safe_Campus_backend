const {
  profileData,
  updateUser,
  deleteUser,
} = require("../services/profile.service");
const sendResponse = require("../utils/sendResponse");
const { validateUpdateUser } = require("../utils/validation/user.validator");

async function getProfile(req, res) {
  try {
    console.log("getting user profile...");
    const { user } = req;
    if (!user) {
      return sendResponse(res, 401, false, "Unauthorized", null);
    }
    const getProfileDetails = await profileData(user.userId);
    if (!getProfileDetails) {
      return sendResponse(res, 404, false, "User not found", null);
    }
    sendResponse(
      res,
      200,
      true,
      "User profile retrieved successfully",
      getProfileDetails
    );
  } catch (error) {
    sendResponse(res, 500, false, "Server error", null, error.message);
  }
}

async function updateProfile(req, res) {
  try {
    console.log("updating user profile...");
    const { user } = req;
    if (!user) {
      return sendResponse(res, 401, false, "Unauthorized", null);
    }
    const { userId } = user;

    const { fullName, email, location, addressDescription } = req.body;
    const updateData = {
      fullName,
      email,
      location,
      addressDescription,
    };
    if (!updateData) {
      return sendResponse(res, 400, false, "No data to update", null);
    }

    const { success, message } = validateUpdateUser(updateData);
    if (!success) {
      return sendResponse(res, 400, false, message, null);
    }

    const updatedUser = await updateUser(userId, updateData);
    if (!updatedUser) {
      return sendResponse(res, 404, false, "User not found", null);
    }

    sendResponse(res, 200, true, "Profile updated successfully", updatedUser);
  } catch (error) {
    sendResponse(res, 500, false, "Server error", null, error.message);
  }
}

async function deleteProfile(req, res) {
  try {
    console.log("deleting user profile...");
    const { user } = req;
    if (!user) {
      return sendResponse(res, 401, false, "Unauthorized", null);
    }
    const { userId } = user;

    const deletedUser = await deleteUser(userId);
    if (!deletedUser) {
      return sendResponse(res, 404, false, "User not found", null);
    }

    sendResponse(res, 200, true, "Profile deleted successfully", null);
  } catch (error) {
    sendResponse(res, 500, false, "Server error", null, error.message);
  }
}

module.exports = {
  getProfile,
  updateProfile,
  deleteProfile,
};
