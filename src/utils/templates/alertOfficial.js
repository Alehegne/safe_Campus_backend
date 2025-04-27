function getAdminGuardEmailInfo(userPayload, receiverEmail) {
  const { user } = userPayload;
  const { fullName, studentId, email, phone } = user;
  const { name, mapUrl } = user.location;
  const { name: originalName, mapUrl: originalMapUrl } = user.originalLocation;

  const subject = "🚨 Security Alert: Immediate Response Required";

  const text = `
  SECURITY ALERT!
  
  Student: ${fullName} (${studentId})
  Email: ${email}
  Phone: ${phone}
  
  Current Location:
  - ${name}
  - Map: ${mapUrl}
  
  Original Location:
  - ${originalName}
  - Map: ${originalMapUrl}
    `.trim();

  const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f8d7da;">
        <h1 style="color: #721c24;">🚨 Security Alert</h1>
        <p style="font-size: 16px;">An emergency alert has been issued. Immediate response required.</p>
        
        <div style="background-color: #fff; padding: 15px; border-radius: 8px; margin-top: 20px;">
          <h2 style="color: #721c24;">Student Details</h2>
          <p><strong>Full Name:</strong> ${fullName}</p>
          <p><strong>Student ID:</strong> ${studentId}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Phone:</strong> ${phone}</p>
        </div>
  
        <div style="background-color: #fff; padding: 15px; border-radius: 8px; margin-top: 20px;">
          <h2 style="color: #721c24;">Current Location</h2>
          <p><strong>Place:</strong> ${name}</p>
          <p><a href="${mapUrl}" style="color: #0c5460; text-decoration: underline;">🔗 View Current Location</a></p>
        </div>
  
        <div style="background-color: #fff; padding: 15px; border-radius: 8px; margin-top: 20px;">
          <h2 style="color: #721c24;">Original Location</h2>
          <p><strong>Place:</strong> ${originalName}</p>
          <p><a href="${originalMapUrl}" style="color: #0c5460; text-decoration: underline;">🔗 View Original Location</a></p>
        </div>
  
        <p style="margin-top: 30px; font-size: 14px; color: #555;">Action Required: Dispatch nearest guard or contact the student immediately.</p>
      </div>
    `;

  return {
    mailto: receiverEmail, // <-- passed dynamically
    subject,
    text,
    html,
  };
}

module.exports = getAdminGuardEmailInfo;
