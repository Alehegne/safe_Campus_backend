const { findWithEmail } = require("../services/auth.service");
const { sendNotification } = require("../services/sendNotification");
const {
  generateTrackingToken,
  generateResponseToken,
} = require("./generateTokens");
const sendEmail = require("./sendEmail");
const getTrustedContactAlert = require("./templates/alertTrustedTemplate");

async function sendAlertToTrustedContacts(
  trustedContacts = [],
  userPayLoad,
  io,
  onlineUsers
) {
  console.log("sending alert to trusted contacts...");
  for (const user of trustedContacts) {
    let registered_contact;
    try {
      registered_contact = await findWithEmail(user.email);
    } catch (error) {
      console.error("Error finding user by email:", error);
      continue;
    }
    const role = registered_contact[0]?.role || "trustedContact";
    if (!registered_contact || registered_contact.length === 0) {
      if (!user.email) {
        console.log("No email provided for trusted contact", user.name);
        continue;
      }

      const trackingToken = generateTrackingToken(
        user.email,
        userPayLoad.user.panicEventId,
        role,
        user.name
      );
      const responseTokenYes = generateResponseToken(
        user.email,
        userPayLoad.user.panicEventId,
        "yes",
        role,
        user.name
      );
      const responseTokenNo = generateResponseToken(
        user.email,
        userPayLoad.user.panicEventId,
        "no",
        role,
        user.name
      );
      const tokens = {
        tracking: trackingToken,
        yes: responseTokenYes,
        no: responseTokenNo,
      };
      const emailInfo = getTrustedContactAlert(userPayLoad, user.email, tokens);

      try {
        await sendEmail(emailInfo);
      } catch (error) {
        console.error("Error sending email:", error);
        continue;
      }

      continue;
    } else if (registered_contact && registered_contact.length > 0) {
      //FCM or socket.io
      const contactId = registered_contact[0]._id.toString();
      const socketId = onlineUsers[contactId];

      if (socketId) {
        //send socket event to the contact
        io.to(socketId).emit("panicEvent", userPayLoad);
      }
      //send FCM to the contact
      console.log("send FCM to contact", user.email);
      if (registered_contact.deviceToken) {
        sendNotification(
          registered_contact.deviceToken,
          "Panic Alert",
          `${userPayLoad.user.fullName} is in danger!`,
          userPayLoad
        );
      }
    }
  }
}

module.exports = sendAlertToTrustedContacts;
