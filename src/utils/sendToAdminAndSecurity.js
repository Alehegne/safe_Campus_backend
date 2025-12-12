const { sendNotification } = require("../services/sendNotification");
const sendEmail = require("./sendEmail");
const getAdminGuardEmailInfo = require("./templates/alertOfficial");

async function sendAlertToAdminAndSecurity(
  adminAndGuards,
  userPayLoad,
  io,
  onlineUsers
) {
  for (const user of adminAndGuards) {
    const id = user._id.toString();
    const socketId = onlineUsers[id];
    if (socketId) {
      //send socket event to the
      io.to(socketId).emit("panicEvent", userPayLoad);
    }

    //send FCM to the contact
    // if (user.deviceToken) {
    //   sendNotification(
    //     user.deviceToken,
    //     "Panic Alert",
    //     `${userPayLoad.user.fullName} is in danger!`,
    //     userPayLoad
    //   );
    // }
    //send email to the contact

    //send email with view link and response link

    const emailInfo = getAdminGuardEmailInfo(userPayLoad, user.email);
    
    await sendEmail(emailInfo);
    console.log("Email sent successfully");
  }
}

module.exports = sendAlertToAdminAndSecurity;
