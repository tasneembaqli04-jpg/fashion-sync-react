const nodemailer = require("nodemailer");

let transporter = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
  }
  return transporter;
}

async function sendMail({ to, subject, html }) {
  const info = await getTransporter().sendMail({
    from: `FashionSync <${process.env.GMAIL_USER}>`,
    to,
    subject,
    html,
  });

  return { emailId: info.messageId };
}

module.exports = {
  sendMail,
};