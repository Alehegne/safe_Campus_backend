function getGuardAlertEmail(userPayload, receiverEmail, tokens) {
  const { user } = userPayload;
  const { fullName, studentId, phone } = user;
  const { name: currentPlace, mapUrl: currentMapUrl } = user.location;

  const backendUrl = process.env.BACKEND_URL || "http://localhost:5000";
  const trackingUrl = `${backendUrl}/api/sos/email-view-tracker?token=${tokens.tracking}`;
  const onTheWay = `${backendUrl}/api/sos/response?token=${tokens.onTheWay}`;
  const reportUrl = `${backendUrl}/api/report/report-update?token=${tokens.report}`;
  const backupUrl = `${backendUrl}/api/report/request-backup?token=${tokens.backup}`;
  const markHandledUrl = `${backendUrl}/api/sos/mark-handled?token=${tokens.markHandled}`;
  const subject = "🚨 GUARD ALERT: Immediate Response Needed!";
  const text = `
  Guard Alert!
  
  Student: ${fullName} (${studentId})
  Phone: ${phone}
  
  Current Location:
  - ${currentPlace}
  - Map: ${currentMapUrl}
  
  Actions:
  - Confirm On The Way
  - Report Situation
  - Request Backup
    `.trim();

  const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f8d7da;">
        <h1 style="color: #721c24;">🚨 Guard Response Required</h1>
        <p>An emergency alert has been triggered for student <strong>${fullName}</strong> (${studentId}).</p>
  
        <div style="margin-top: 20px;">
          <h2>Current Location</h2>
          <p><strong>Place:</strong> ${currentPlace}</p>
          <p><a href="${currentMapUrl}" style="color: #0c5460;">🔗 View Location</a></p>
        </div>
  
        <div style="margin-top: 30px;">
          <a href="${onTheWay}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; margin-right: 10px;">
            Confirm On The Way
          </a>
          <a href="${reportUrl}" style="display: inline-block; padding: 10px 20px; background-color: #ffc107; color: white; text-decoration: none; border-radius: 5px; margin-right: 10px;">
            Report Situation
          </a>
          <a href="${backupUrl}" style="display: inline-block; padding: 10px 20px; background-color: #dc3545; color: white; text-decoration: none; border-radius: 5px;">
            Request Backup
          </a>
           <a href="${markHandledUrl}" style="display: inline-block; padding: 10px 20px; background-color: #dc3545; color: white; text-decoration: none; border-radius: 5px;">
            Mark as Handled
          </a>
        </div>
  
        <p style="margin-top: 40px; font-size: 12px; color: #555;">This alert is intended for authorized security personnel only.</p>
            <!-- Hidden Tracking Pixel -->
      <img src="${trackingUrl}" width="1" height="1" style="display:none;" alt="." />
      </div>
    `;

  return {
    mailto: receiverEmail,
    subject,
    text,
    html,
  };
}
module.exports = getGuardAlertEmail;
