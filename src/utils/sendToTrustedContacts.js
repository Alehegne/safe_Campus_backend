const { findWithEmail } = require("../services/auth.service");
const { sendNotification } = require("../services/sendNotification");
const {
  generateTrackingToken,
  generateResponseToken,
} = require("./generateTokens");
const { isValidEmail } = require("./helper");
const sendEmail = require("./sendEmail");
const getTrustedContactAlert = require("./templates/alertTrustedTemplate");

async function sendAlertToTrustedContacts(
  trustedContacts = [],
  userPayLoad,
  io,
  onlineUsers
) {
  console.log("sending alert to trusted contacts...");
  console.log("trusted contactsss:",trustedContacts);
  for (const user of trustedContacts) {
    let registered_contact;
    try {
      registered_contact = await findWithEmail(user.email);
    } catch (error) {
      console.error("Error finding user by email:", error);
      continue;
    }
    const role = registered_contact[0]?.role || "trustedContact";
    // if (!registered_contact || registered_contact.length === 0 || registered_contact[0].deviceToken) {
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
      console.log("user payload:",userPayLoad);
      const emailInfo = getTrustedContactAlert(userPayLoad, user.email, tokens);

      try {
        if(isValidEmail(user.email)){
        console.log("emails sent to:",user);
        await sendEmail(emailInfo);
        }
      } catch (error) {
        console.error("Error sending email:", error);
        continue;
      }

      // continue;
   if (registered_contact && registered_contact.length > 0) {
      //FCM or socket.io
      console.log("sending notifications::")
      // const contactId = registered_contact[0]._id.toString();
      // const socketId = onlineUsers[contactId];

      // if (socketId) {
      //   //send socket event to the contact
      //   io.to(socketId).emit("panicEvent", userPayLoad);
      // }
      //send FCM to the contact
      // console.log("send FCM to contact", user.email);
      console.log(registered_contact);
      if (registered_contact[0].deviceToken) {
        console.log("sending firebase message to :",user)
        sendNotification(
          registered_contact[0].deviceToken,
          "Panic Alert",
          `${userPayLoad.user.fullName} is in danger!`,
          userPayLoad
        );
      }
    }
  }
}

module.exports = sendAlertToTrustedContacts;
