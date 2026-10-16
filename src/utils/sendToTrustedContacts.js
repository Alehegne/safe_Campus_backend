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
  onlineUsers,
) {
  console.log("Sending alerts to trusted contacts...:", trustedContacts);
  for (const user of trustedContacts) {
    console.log("Processing trusted contact:", user);
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
      user.name,
    );
    const responseTokenYes = generateResponseToken(
      user.email,
      userPayLoad.user.panicEventId,
      "yes",
      role,
      user.name,
    );
    const responseTokenNo = generateResponseToken(
      user.email,
      userPayLoad.user.panicEventId,
      "no",
      role,
      user.name,
    );
    const tokens = {
      tracking: trackingToken,
      yes: responseTokenYes,
      no: responseTokenNo,
    };
    const emailInfo = getTrustedContactAlert(userPayLoad, user.email, tokens);

    try {
      if (isValidEmail(user.email)) {
        console.log("emails sent to:", user);
        await sendEmail(emailInfo);
      }
    } catch (error) {
      console.error("Error sending email:", error);
      continue;
    }

    // continue;
    if (registered_contact && registered_contact.length > 0) {
      console.log("registered_contact:", registered_contact);
      if (registered_contact[0].deviceToken) {
        try {
          console.log("sending firebase message to :", user.email);
          await sendNotification(
            registered_contact[0].deviceToken,
            "Panic Alert",
            `${userPayLoad.user.fullName} is in danger!`,
            userPayLoad,
          );
        } catch (error) {
          console.error("Push notification failed for trusted contact", {
            email: user.email,
            name: user.name,
            role: registered_contact[0]?.role || "trustedContact",
            message: error?.message,
          });
        }
      }
    }
  }
  console.log("Finished sending alerts to trusted contacts.");
}

module.exports = sendAlertToTrustedContacts;
