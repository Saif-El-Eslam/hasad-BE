import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.GOOGLE_APP_PASSWORD,
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
