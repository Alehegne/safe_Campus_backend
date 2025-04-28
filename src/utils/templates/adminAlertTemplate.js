function getAdminAlertEmail(userPayload, receiverEmail, tokens) {
  const { user } = userPayload;
  const { fullName, studentId, email, phone } = user;
  const { name: currentPlace, mapUrl: currentMapUrl } = user.location;
  const { name: originalPlace, mapUrl: originalMapUrl } = user.originalLocation;

  const subject = "🚨 ADMIN ALERT: Immediate Action Required!";

  const text = `
  Admin Alert!
  
  Student: ${fullName} (${studentId})
  Email: ${email}
  Phone: ${phone}
  
  Current Location:
  - ${currentPlace}
  - Map: ${currentMapUrl}
  
  Original Location:
  - ${originalPlace}
  - Map: ${originalMapUrl}
  
  Actions:
  - Assign Guard
  - Mark Case as Handled
    `.trim();

  const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #ffeeba;">
        <h1 style="color: #856404;">🚨 Admin Attention Required</h1>
        <p>${fullName} (${studentId}) has triggered an emergency panic alert.</p>
  
        <div style="margin-top: 20px;">
          <h2>Current Location</h2>
          <p><strong>Place:</strong> ${currentPlace}</p>
          <p><a href="${currentMapUrl}" style="color: #0c5460;">🔗 View Current Location</a></p>
        </div>
  
        <div style="margin-top: 20px;">
          <h2>Original Location</h2>
          <p><strong>Place:</strong> ${originalPlace}</p>
          <p><a href="${originalMapUrl}" style="color: #0c5460;">🔗 View Original Location</a></p>
        </div>
  
        <div style="margin-top: 30px;">
          <a href="https://yourdomain.com/assign-guard?studentId=${studentId}" style="display: inline-block; padding: 10px 20px; background-color: #28a745; color: white; text-decoration: none; border-radius: 5px; margin-right: 10px;">
            Assign Guard
          </a>
          <a href="https://yourdomain.com/mark-handled?studentId=${studentId}" style="display: inline-block; padding: 10px 20px; background-color: #dc3545; color: white; text-decoration: none; border-radius: 5px;">
            Mark as Handled
          </a>
        </div>
  
        <p style="margin-top: 40px; font-size: 12px; color: #555;">This is an automated alert sent to administrative personnel only.</p>
      </div>
    `;

  return {
    mailto: receiverEmail,
    subject,
    text,
    html,
  };
}

module.exports = getAdminAlertEmail;
