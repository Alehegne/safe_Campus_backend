const { getIO } = require("../config/socket.config");
const PanicEvent = require("../models/panicEvent.model");
const { getGoogleMapURL } = require("../utils/helper");
const sendAlertToAdminAndSecurity = require("../utils/sendToAdminAndSecurity");
const sendAlertToTrustedContacts = require("../utils/sendToTrustedContacts");
const { findUserById, findAdminAndSecurity } = require("./auth.service");

async function sendPanic(userId, location, eventId) {
  //get the user details from the database
  const userInfo = await findUserById(userId);
  if (!userInfo) {
    throw new Error("User not found!");
  }
  //      1. Get trustedContacts, guards, admins
  //    2. For each trustedContact:
  //     - If not signed up → send email
  //     - If signed up:
  //         - If online → socket.io
  //         - If offline → FCM
  //    3. For each guard and admin:
  //     - Same logic: online → socket, offline → FCM
  console.log("userInfo:", userInfo);
  const trustedContacts = userInfo.trustedContacts;
  const adminAndGuards = await findAdminAndSecurity();
  const io = getIO();
  const userPayLoad = getUserPayload(userInfo, location, eventId);
  await sendAlertToTrustedContacts(trustedContacts, userPayLoad, io);
  await sendAlertToAdminAndSecurity(adminAndGuards, userPayLoad, io);
}
async function savePanicEvent(panicEvent) {
  const newPanicEvent = new PanicEvent(panicEvent);
  await newPanicEvent.save();
  return newPanicEvent;
}

function getUserPayload(userInfo, location, eventId) {
  return {
    eventType: "panicEvent",
    user: {
      fullName: userInfo.fullName,
      studentId: userInfo.studentId,
      email: userInfo.email,
      phone: userInfo?.phone,
      location: {
        mapUrl: getGoogleMapURL(
          location.coordinates[1],
          location.coordinates[0]
        ),
        coordinates: location.coordinates,
        name: location?.address, //assuming we get the address from the frontend
      },
      originalLocation: {
        mapUrl: getGoogleMapURL(
          userInfo.location.coordinates[1],
          userInfo.location.coordinates[0]
        ),
        coordinates: userInfo.location.coordinates,
        name: userInfo?.addressDescription,
      },
      panicEventId: eventId,
    },
  };
}

module.exports = {
  sendPanic,
  savePanicEvent,
};
