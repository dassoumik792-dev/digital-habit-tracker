/**
 * Email Utility
 * Sends emails using Nodemailer
 */

const nodemailer = require('nodemailer');

const sendEmail = async ({ to, subject, html, text }) => {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_FROM || 'FocusPulse AI <noreply@focuspulse.ai>',
    to,
    subject,
    html,
    text: text || html?.replace(/<[^>]*>/g, ''),
  };

  const info = await transporter.sendMail(mailOptions);
  console.log('Email sent:', info.messageId);
  return info;
};

module.exports = sendEmail;
