const { sendNotification } = require("../services/sendNotification");
const sendEmail = require("./sendEmail");
const getAdminGuardEmailInfo = require("./templates/alertOfficial");

async function sendAlertToAdminAndSecurity(
  adminAndGuards,
  userPayLoad,
  io,
  onlineUsers
) {
  console.log("Sending alerts to admin and security...", adminAndGuards);
  console.log("user payload:", userPayLoad);
  console.log("online users:", onlineUsers);
  console.log("io object:", io);
  for (const user of adminAndGuards) {
    console.log("Processing admin/security contact:", user);
    const id = user._id.toString();
    let socketId = null;
    if (onlineUsers && id in onlineUsers) {
      socketId = onlineUsers[id];
    }
    if (socketId) {
      //send socket event to the
      io.to(socketId).emit("panicEvent", userPayLoad);
    }
    console.log("Sending alert to admin/security:", user);
    //send FCM to the contact
    if (user.deviceToken) {
      sendNotification(
        user.deviceToken,
        "Panic Alert",
        `${userPayLoad.user.fullName} is in danger!`,
        userPayLoad
      );
    }
    //send email to the contact

    //send email with view link and response link

    const emailInfo = getAdminGuardEmailInfo(userPayLoad, user.email);

    await sendEmail(emailInfo);
    console.log("Email sent successfully");
  }
}

module.exports = sendAlertToAdminAndSecurity;
