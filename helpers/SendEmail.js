const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    // host: "server136-5.web-hosting.com",
    host: "desolate-beyond-24995.herokuapp.com",
    port: 465,
    auth: {
      user: "support@acecoins.uk",
      pass: "acecoins2020",
    },
  });

  const message = {
    from: `admin@acecoins.uk <admin@acecoins.uk>`,
    to: options.email,
    subject: options.subject,
    html: options.message,
    text: options.body,
  };

  const info = await transporter.sendMail(message).catch(console.log);

  //console.log('Message sent: %s', info.messageId);
};

module.exports = sendEmail;
