const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendEmail = (email, subject, message) => {
  sgMail.send({
    to: email,
    from: 'huzefachabukswar@gmail.com',
    subject: subject,
    text: message,
  });
};

module.exports = { sendEmail };
