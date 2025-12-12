const nodeMailer = require("nodemailer");
4;

/*
   info = {
       mailto: "",
       subject: "",
       text: "",
       html: "",
       }
   */
async function sendEmail(info) {
  const transporter = nodeMailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
  const mailOptions = {
    from: '"Safe campus" <noreply@jobportal.com>',
    to: info.mailto,
    subject: info.subject,
    text: info.text || "",
    html: info.html,
  };

  try {
    console.log("sending emails to :",info.mailto)
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.log("Error sending email", error);
    throw new Error(`Error sending email : ${error}`);
  }
}

module.exports = sendEmail;
