import nodemailer from "nodemailer";
import { config } from "./index.js";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: config.mailPassword,
  },
});

const sendTransactionalEmail = async ({ user, subject, htmlContent }) => {
  return transporter.sendMail({
    from: `"Hasad Bookapp" <${process.env.EMAIL}>`,
    to: user.email,
    subject,
    html: htmlContent,
  });
};

export default sendTransactionalEmail;

export const verifyMailer = () => transporter.verify();

const recoveryTransporter = nodemailer.createTransport({
  service: "gmail",
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000,
  auth: { user: process.env.EMAIL, pass: config.mailPassword },
});
export const sendRecoveryEmail = ({ user, code }) =>
  recoveryTransporter.sendMail({
    from: `"Hasad Bookapp" <${process.env.EMAIL}>`,
    to: user.email,
    subject: "Reset Your Password",
    text: `Your Hasad password reset code is ${code}. It expires in ten minutes. If you did not request it, ignore this email.`,
    html: `<p>Your Hasad password reset code is <strong>${code}</strong>.</p><p>It expires in ten minutes. If you did not request it, ignore this email.</p>`,
  });
