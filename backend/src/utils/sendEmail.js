const nodemailer = require('nodemailer');

const config = process.env.SMTP_HOST
  ? {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    }
  : {
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    };

const transporter = nodemailer.createTransport(config);

const sendEmail = async (to, subject, html) => {
  const fromEmail = process.env.SMTP_HOST ? (process.env.SMTP_FROM || process.env.SMTP_USER) : process.env.EMAIL_USER;
  await transporter.sendMail({
    from: fromEmail,
    to,
    subject,
    html
  });
};

module.exports = sendEmail;