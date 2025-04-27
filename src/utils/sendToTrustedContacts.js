const { findWithEmail } = require("../services/auth.service");
const {
  generateTrackingToken,
  generateResponseToken,
} = require("./generateTokens");
const sendEmail = require("./sendEmail");
const getTrustedContactAlert = require("./templates/alertTrustedTemplate");

async function sendAlertToTrustedContacts(
  trustedContacts = [],
  userPayLoad,
  io
) {
  console.log("trusted contacts:", trustedContacts);
  console.log("starting to send alert to trusted contacts");
  for (const user of trustedContacts) {
    const registered_contact = await findWithEmail(user.email);
    console.log("usersss:", user);
    console.log("sending to trusted contact:", user.email);
    // not registered contact, send email
    console.log("registered contact", registered_contact);
    const role = registered_contact[0]?.role || "trustedContact";
    if (!registered_contact || registered_contact.length === 0) {
      console.log("not registered contact, send email to:", user.email);
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
      await sendEmail(emailInfo);
      console.log("sent email to not registered contact:", user.email);

      continue;
    }
    if (registered_contact && registered_contact.length === 0) {
      console.log(
        "sending to user in the app with socket or fcm(registed contact):",
        registered_contact[0].email
      );
      //FCM or socket.io
      const contactId = registered_contact[0]._id.toString();
      const socketId = global.onlineUsers[contactId];

      if (socketId) {
        //send socket event to the contact
        console.log("send socket event to contact", user.email);
        io.to(socketId).emit("panicEvent", userPayLoad);
        console.log("done sending socket event to contact:", user.email);
      }
      //send FCM to the contact
      console.log("send FCM to contact", user.email);
      // if (registered_contact.deviceToken) {
      //   sendNotification(
      //     registered_contact.deviceToken,
      //     "Panic Alert",
      //     `${userInfo.fullName} is in danger!`,
      //     userPayLoad
      //   );
      // }
      console.log("done sending FCM to contact:", user.email);
      console.log("done for trusted contact:", user.email);
    }
  }
}

module.exports = sendAlertToTrustedContacts;
