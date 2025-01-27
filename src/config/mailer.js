import brevo from "@getbrevo/brevo";

let apiInstance = new brevo.TransactionalEmailsApi();

// Configure API key authorization: api-key
let apiKey = apiInstance.authentications["apiKey"];
apiKey.apiKey = process.env.BREVO_API_KEY;

/**
 * Sends a transactional email using Brevo (formerly Sendinblue).
 *
 * @param {Object} options - Options for the email.
 * @param {Object} options.user - The user object containing name and email.
 * @param {string} options.subject - The subject of the email.
 * @param {string} options.htmlContent - The HTML content of the email.
 * @returns {Promise} - A promise that resolves with the API response or rejects with an error.
 */
const sendTransactionalEmail = async ({ user, subject, htmlContent }) => {
  // let apiInstance = new brevo.TransactionalEmailsApi();
  let sendSmtpEmail = new brevo.SendSmtpEmail();

  sendSmtpEmail.subject = subject;
  sendSmtpEmail.htmlContent = htmlContent;
  sendSmtpEmail.sender = { name: "Hasad Bookapp", email: process.env.EMAIL };
  sendSmtpEmail.to = [
    { name: `${user.first_name} ${user.last_name}`, email: user.email },
  ];
  sendSmtpEmail.replyTo = { email: process.env.EMAIL, name: "Hasad Bookapp" };

  try {
    const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
    return data;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};

export default sendTransactionalEmail;
