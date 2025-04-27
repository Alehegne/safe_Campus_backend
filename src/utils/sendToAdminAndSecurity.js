const sendEmail = require("./sendEmail");
const getAdminGuardEmailInfo = require("./templates/alertOfficial");

async function sendAlertToAdminAndSecurity(adminAndGuards, userPayLoad, io) {
  console.log("starting to send alert to admin and guards");
  for (const user of adminAndGuards) {
    console.log("send alert to admin and guards:", user.email);
    const id = user._id.toString();
    const socketId = global.onlineUsers[id];
    if (socketId) {
      //send socket event to the
      io.to(socketId).emit("panicEvent", userPayLoad);
      console.log("done sending socket event to admin and guards:", user.email);
    }

    //send FCM to the contact
    // if (user.deviceToken) {
    //   sendNotification(
    //     user.deviceToken,
    //     "Panic Alert",
    //     `${userInfo.fullName} is in danger!`,
    //     userPayLoad
    //   );
    // }
    //send email to the contact

    //send email with view link and response link

    console.log("send email to admin and guards:", user.email);

    const emailInfo = getAdminGuardEmailInfo(userPayLoad, user.email);
    await sendEmail(emailInfo);
    console.log("done sending email to admin and guards:", user.email);
  }
}

module.exports = sendAlertToAdminAndSecurity;
