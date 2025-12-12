function getTrustedContactAlert(userPayload, mailto, tokens) {
  const { user } = userPayload;
  const { fullName, studentId } = user;
  const { name, mapUrl } = user.location;
  const {
    name: originalName,
    mapUrl: originalMapUrl,
    coordinates: originalCoordinates,
  } = user.location;
  const backendUrl = process.env.BACKEND_URL || "http://localhost:5000";
  const trackingUrl = `${backendUrl}/api/sos/email-view-tracker?token=${tokens.tracking}`;
  const responseUrlYes = `${backendUrl}/api/sos/response?token=${tokens.yes}`;
  const responseUrlNo = `${backendUrl}/api/sos/response?token=${tokens.no}`;

  const subject = "🚨 Panic Alert: Your Friend Needs Help!";

  const text = `
URGENT!

Your trusted contact ${fullName} (${studentId}) has triggered a panic alert.

Current Location:
- Place: ${name}
- Map: ${mapUrl}

Original Location:
- Place: ${originalName}
- Coordinates: ${originalCoordinates[1]}, ${originalCoordinates[0]}
- Map: ${originalMapUrl}

Please reach out to them immediately.
`.trim();

  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #fff3cd;">
      <h1 style="color: #856404;">🚨 Your Friend Needs Help!</h1>
      <p style="font-size: 16px;">
        <strong>${fullName}</strong> (${studentId}) has triggered a panic alert.
      </p>

      <div style="margin-top: 20px;">
        <h2 style="color: #856404;">📍 Current Location</h2>
        <p><strong>Place:</strong> ${name}</p>
        <p><a href="${mapUrl}" style="color: #0c5460; text-decoration: underline;">🔗 View Location on Map</a></p>
      </div>

      <div style="margin-top: 20px;">
        <h2 style="color: #856404;">🧭 Original Location</h2>
        <p><strong>Place:</strong> ${originalName}</p>
        <p><strong>Coordinates:</strong> ${originalCoordinates[1]}, ${originalCoordinates[0]}</p>
        <p><a href="${originalMapUrl}" style="color: #0c5460; text-decoration: underline;">🔗 View Original Location on Map</a></p>
      </div>

      <div style="margin-top: 30px;">
        <a href="${responseUrlYes}" style="background-color: green; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; margin-right: 10px;">✅ Yes, I'll Help</a>

        <a href="${responseUrlNo}" style="background-color: red; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">❌ No, Can't Help</a>
      </div>

      <p style="margin-top: 30px; font-size: 14px; color: #555;">
        Please try contacting them or alert nearby security immediately.
      </p>

      <!-- Hidden Tracking Pixel -->
      <img src="${trackingUrl}" width="1" height="1" style="display:none;" alt="." />
    </div>
  `;

  return {
    mailto,
    subject,
    text,
    html,
  };
}

module.exports = getTrustedContactAlert;
