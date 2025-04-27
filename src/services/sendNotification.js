const admin = require("../config/firebaseAdmin.config");

async function sendNotification(deviceToken, title, body, data = {}) {
  const message = {
    token: deviceToken,
    notification: {
      title: title,
      body: body,
    },
    data: data, // Optional: extra custom payload
    android: {
      priority: "high",
      notification: {
        sound: "default",
      },
    },
    apns: {
      payload: {
        aps: {
          sound: "default",
        },
      },
    },
  };

  try {
    const response = await admin.messaging().send(message);
    console.log("Successfully sent notification:", response);
    return response;
  } catch (error) {
    console.error("Error sending notification:", error);
    throw error;
  }
}

module.exports = {
  sendNotification,
};
