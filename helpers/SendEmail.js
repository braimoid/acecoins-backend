const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
	const transporter = nodemailer.createTransport({
		host: 'acecoins.uk',
		port: 465,
		auth: {
			user: 'support@acecoins.uk',
			pass: 'acecoins2020',
		},
	});

	const message = {
		from: `admin@acecoins.uk <admin@acecoins.uk>`,
		to: options.email,
		subject: options.subject,
		html: options.message,
		text: options.body,
	};

	const info = await transporter.sendMail(message).then(console.log).catch(console.log);

	//console.log('Message sent: %s', info.messageId);
};

module.exports = sendEmail;
