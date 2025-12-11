const { validateUser } = require("../utils/validation/user.validator");
const sendResponse = require("../utils/sendResponse");
const {
  saveUser,
  getByEmailOrStudentId,
  findWithEmail,
  updateTokenService,
} = require("../services/auth.service");
const { generateJwtToken, comparePassword } = require("../utils/helper");
const userModel = require("../models/user.model");
const cacheKey = require("../utils/cache/cacheKey");
const { delCacheByPrefix } = require("../utils/cache/cacheService");
const jwt = require("jsonwebtoken");


async function registerUser(req, res) {
  try {
    console.log("registering user...");
    if (!req.body || req.body.length === 0) {
      sendResponse(res, 400, false, "please provide registration information");
    }
    //only register students
    // if (req.body.role === "admin" || req.body.role === "campus_security") {
    //   return sendResponse(
    //     res,
    //     400,
    //     false,
    //     "admin and campus security cannot register here!"
    //   );
    // }

    const { studentId, email } = req.body;

    const { success, message } = validateUser(req.body);
    if (!success) {
      return sendResponse(res, 400, false, message);
    }
    // Check if user already exists
    let existingUser = [];
    if (req.body.role === "student") {
      existingUser = (await getByEmailOrStudentId(email, studentId)) || [];
    } else {
      existingUser = (await findWithEmail(email)) || [];
    }
    // console.log("existingUser:", existingUser);
    if (!(existingUser.length === 0)) {
      return sendResponse(
        res,
        400,
        false,
        "User with this email or student id already exists."
      );
    }
    const newUser = await saveUser(req.body);
    if (!newUser) {
      return sendResponse(res, 400, false, "User registration failed");
    }

    sendResponse(res, 201, true, "User registered successfully", {
      _id: newUser._id,
      studentId: newUser?.studentId,
      email: newUser.email,
      role: newUser.role,
    });
  } catch (error) {
    console.error("Register error:", error);
    sendResponse(res, 500, false, "Server error", null, error.message);
  }
}

//add trusted contacts
async function addTrustedContacts(req, res) {
  try {
    console.log("adding trusted contacts...");
    const { user } = req;
    if (!req.body || req.body.length === 0) {
      return sendResponse(
        res,
        400,
        false,
        "Please provide trusted contacts information"
      );
    }
    //get contacts array from body
    const { contacts } = req.body;

    const updatedUser = await userModel.findByIdAndUpdate(
      user.userId,
      {
        $push: {
          trustedContacts: { $each: contacts },
        },
      },
      { new: true } // Return the updated user
    );
    if (!updatedUser) {
      return sendResponse(res, 404, false, "User not found", null);
    }
    sendResponse(res, 200, true, "Trusted contacts added successfully");
    
  } catch (error) {
    console.error("Error adding trusted contacts:", error);
    sendResponse(res, 500, false, "Server error", null, error.message);
  }
}

async function getTrustedContacts(req, res) {
  try {
    console.log("getting trusted contacts...");

    const { user } = req;
    //get the user trusted contacts from the database
    const users = await userModel.findById(user.userId);
    if (!users) {
      sendResponse(res, 404, false, "User not found", null);
    }
    const filteredContacts = users.trustedContacts.map((contact) => {
      return {
        name: contact.name,
        phone: contact.phone,
        email: contact.email,
      };
    });
    return sendResponse(
      res,
      200,
      true,
      "Trusted contacts retrieved successfully",
      {
        trustedContacts: filteredContacts,
      }
    );
  } catch (error) {
    console.error("Error getting trusted contacts:", error);
    sendResponse(res, 500, false, "Server error", null, error.message);
  }
}

async function logInUser(req, res) {
  try {
    console.log("logging in user...");
    if (!req.body) {
      sendResponse(res, 400, true, "please provide log in information");
    }
    const { email, password, deviceToken } = req.body;
    if (!email || !password) {
      return sendResponse(res, 400, false, "please provide email and password");
    }
    // check if device token is provided
    //TODO: enable device token later
    // if (!deviceToken) {
    //   return sendResponse(res, 400, false, "please provide device token");
    // }

    //
    const existing = await findWithEmail(email);

    if (!existing || existing.length === 0) {
      return sendResponse(res, 401, "please register first");
    }
    // Check if password is correct
    const isMatch = await comparePassword(existing[0].password, password);
    if (!isMatch) {
      return sendResponse(
        res,
        401,
        false,
        "please enter the correct password!"
      );
    }
    // Generate JWT token
    const payload = {
      userId: existing[0]._id,
      role: existing[0].role,
      studentId: existing[0].studentId,
      email: existing[0].email,
    };
    const token = generateJwtToken(payload);
    //generate refresh token
    const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRATION,
    });
    if (!token) {
      return sendResponse(res, 401, false, "Invalid credentials");
    }
    //filter
    const filteredUser = existing[0].toObject();
    delete filteredUser.password;
    delete filteredUser.__v;

    // Update the user's token in the database
    const updateToken = await userModel.findByIdAndUpdate(existing[0]._id, {
      deviceToken: deviceToken,
    });
    if (!updateToken) {
      return sendResponse(res, 400, false, "Failed to update token");
    }

    sendResponse(res, 200, true, "Login successful", {
      token,
      refreshToken,
      user: {
        ...filteredUser,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
}

async function updateUserToken(req, res) {
  try {
    console.log("updating user token...");
    const { user } = req;
    if (!req.body || req.body.length === 0) {
      return sendResponse(res, 400, false, "Please provide token information");
    }
    const { token } = req.body;
    if (!token) {
      return sendResponse(res, 400, false, "Please provide a token");
    }
    // Update the user's token in the database
    const updateToken = await updateTokenService(user.userId, token);

    if (!updateToken) {
      return sendResponse(res, 400, false, "Failed to update token");
    }
    sendResponse(res, 200, true, "Token updated successfully");
  } catch (error) {
    console.error("Error updating user token:", error);
    sendResponse(res, 500, false, "Server error", null, error.message);
  }
}
async function updateTrustedContacts(req, res) {
  try {
    const { user } = req;
    if (!req.body || req.body.length === 0) {
      return sendResponse(
        res,
        400,
        false,
        "Please provide trusted contacts information"
      );
    }
    const { contact } = req.body;

    const updatedUser = await userModel.findByIdAndUpdate(
      user.userId,
      {
        trustedContacts: {
          $push: {
            trustedContacts: contact,
          },
        },
      },
      { new: true } // Return the updated user
    );

    if (!updatedUser) {
      return sendResponse(res, 404, false, "User not found", null);
    }
    //filter the passwod and __v
    const filteredUser = updatedUser.toObject();
    delete filteredUser.password;
    delete filteredUser.__v;
    delete filteredUser.deviceToken;
    delete filteredUser.createdAt;
    delete filteredUser.updatedAt;
    //delete cache
    delCacheByPrefix(cacheKey.profile(user.userId));

    sendResponse(res, 200, true, "Trusted contacts updated successfully", {
      user: {
        ...filteredUser,
      },
    });
  } catch (error) {
    console.log("Error updating trusted contacts:", error);
    sendResponse(
      res,
      500,
      false,
      "Server error while updating trusted contacts",
      null,
      error.message
    );
  }
}
async function adminController(req, res) {
  try {
    console.log("admin controller...");
    if (!req.body || req.body.length === 0) {
      return sendResponse(res, 400, false, "Please provide information");
    }
    const { fullName, email, password, role } = req.body;
    if (!fullName || !email || !password || !role) {
      return sendResponse(res, 400, false, "Please provide all fields");
    }
    // Check if user already exists
    const existingUser = await findWithEmail(email);
    if (existingUser && existingUser.length > 0) {
      return sendResponse(
        res,
        400,
        false,
        "User with this email already exists."
      );
    }
    // Check if the role is valid
    const validRoles = ["admin", "campus_security", "student"];
    if (!validRoles.includes(role)) {
      return sendResponse(res, 400, false, "Invalid role provided.");
    }
    // Create a new user
    const newUser = await saveUser({
      fullName,
      email,
      password,
      role,
    });

    if (!newUser) {
      return sendResponse(res, 400, false, "User registration failed");
    }

    return sendResponse(res, 201, true, "User registered successfully");
  } catch (error) {
    console.error("Error in admin controller:", error);
    sendResponse(res, 500, false, "Server error", null, error.message);
  }
}
async function refrehToken(req, res) {
  try {
    console.log("refreshing token...");
    const  refreshToken  = req.body.refresh_token;
    if (!refreshToken) {
      return sendResponse(res, 400, false, "Please provide refresh token");
    }
    //verify token
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    if (!decoded) {
      return sendResponse(res, 401, false, "Invalid refresh token");
    }
    const payload = {
      userId: decoded.userId,
      role: decoded.role,
      studentId: decoded.studentId,
  }
    const newToken = generateJwtToken(payload);
    console.log("done refreshing token!")
    return sendResponse(res, 200, true, "Token refreshed successfully", {
      token: newToken,
    });
  } catch (error) {
    console.error("Error refreshing token:", error);
    sendResponse(res, 500, false, "Server error", null, error.message);
  }
}
module.exports = {
  registerUser,
  logInUser,
  updateUserToken,
  updateTrustedContacts,
  adminController,
  getTrustedContacts,
  refrehToken,
  addTrustedContacts
};
