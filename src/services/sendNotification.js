const admin = require("../config/firebaseAdmin.config");

async function sendNotification(deviceToken, title, body, data = {}) {
  // Convert all values in the data object to strings
  const stringifiedData = Object.keys(data).reduce((acc, key) => {
    acc[key] = String(data[key]); // Convert each value to a string
    return acc;
  }, {});

  const message = {
    token: deviceToken,
    notification: {
      title: title,
      body: body,
    },
    data: stringifiedData, // Ensure all values are strings
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
    console.log("Successfully sent notification via FCM:", response);
    return response;
  } catch (error) {
    console.error("Error sending notification:", error);
    throw error;
  }
}

module.exports = {
  sendNotification,
};
