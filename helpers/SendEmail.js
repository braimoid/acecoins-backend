const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
	const transporter = nodemailer.createTransport({
		host: 'acecoins.uk',
		port: 465,
		auth: {
			user: 'admin@acecoins.uk',
			pass: 'a9G$u_OCTtU%',
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

	console.log('Message sent: %s', info.messageId);
};

module.exports = sendEmail;
