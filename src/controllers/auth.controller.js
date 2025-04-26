const { validateUser } = require("../utils/validation/user.validator");
const sendResponse = require("../utils/sendResponse");
const {
  saveUser,
  getByEmailOrStudentId,
  findWithEmail,
} = require("../services/auth.service");
const { generateJwtToken, comparePassword } = require("../utils/helper");

async function registerUser(req, res) {
  try {
    if (!req.body) {
      sendResponse(res, 400, true, "please provide registration information");
    }
    const { studentId, email } = req.body;

    const { success, message } = validateUser(req.body);
    if (!success) {
      return sendResponse(res, 400, false, message);
    }

    const existingUser = await getByEmailOrStudentId(email, studentId);
    if (existingUser) {
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

async function logInUser(req, res) {
  try {
    if (!req.body) {
      sendResponse(res, 400, true, "please provide log in information");
    }
    const { email, password } = req.body;
    if (!email || !password) {
      return sendResponse(res, 403, false, "please provide email and password");
    }

    //
    const existing = await findWithEmail(email);
    console.log("exin:", existing);
    if (!existing || existing.length === 0) {
      return sendResponse(res, 401, "please register first");
    }
    // Check if password is correct
    const isMatch = await comparePassword(existing[0].password, password);
    console.log("ismatch:", isMatch);
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
    };
    const token = generateJwtToken(payload);
    if (!token) {
      return sendResponse(res, 401, false, "Invalid credentials");
    }
    sendResponse(res, 200, true, "Login successful", {
      token,
      user: {
        _id: existing._id,
        studentId: existing.studentId,
        email: existing.email,
        role: existing.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
}

module.exports = {
  registerUser,
  logInUser,
};
