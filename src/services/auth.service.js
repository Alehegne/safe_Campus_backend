const User = require("../models/user.model");

async function saveUser(userData) {
  const user = new User(userData);
  await user.save();
  return user;
}
async function getByEmailOrStudentId(email, studentId) {
  const user = await User.findOne({
    $or: [{ email }, { studentId }],
  });

  return user;
}
async function findWithEmail(email) {
  const user = await User.find({ email });
  return user;
}
async function findWithStudentId(studentId) {
  const user = await User.find({ studentId });
  return user;
}
async function findUserById(id) {
  const user = await User.findById(id);
  return user;
}
async function findAdminAndSecurity() {
  const user = await User.find({
    role: { $in: ["admin", "campus_security"] },
  });
  return user;
}

async function updateTokenService(userId, token) {
  const user = await User.findByIdAndUpdate(
    userId,
    {
      deviceToken: token,
    },
    {
      new: true,
    }
  );

  return user;
}

module.exports = {
  saveUser,
  getByEmailOrStudentId,
  findWithEmail,
  findWithStudentId,
  findUserById,
  findAdminAndSecurity,
  updateTokenService,
};
