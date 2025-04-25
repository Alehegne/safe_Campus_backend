const { profileData, updateUser } = require("../services/profile.service");
const sendResponse = require("../utils/sendResponse");
const { validateUpdateUser } = require("../utils/validation/user.validator");

async function getProfile(req, res) {
  try {
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

    // validate the update data
    const { success, message } = validateUpdateUser(updateData);
    if (!success) {
      return sendResponse(res, 400, false, message, null);
    }
    const updatedProfile = await updateUser(userId, updateData);
    if (!updatedProfile) {
      return sendResponse(res, 404, false, "User not found", null);
    }
    sendResponse(
      res,
      200,
      true,
      "User profile updated successfully",
      updatedProfile
    );
  } catch (error) {
    sendResponse(res, 500, false, "Server error", null, error.message);
  }
}
async function deleteProfile(req, res) {
  try {
    const { user } = req;
    if (!user) {
      return sendResponse(res, 401, false, "Unauthorized", null);
    }
    const { userId } = user;
    const deletedProfile = await deleteUser(userId);
    if (!deletedProfile) {
      return sendResponse(res, 404, false, "User not found", null);
    }
    sendResponse(
      res,
      200,
      true,
      "User profile deleted successfully",
      deletedProfile
    );
  } catch (error) {
    sendResponse(res, 500, false, "Server error", null, error.message);
  }
}

module.exports = { getProfile, updateProfile, deleteProfile };
