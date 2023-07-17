require('dotenv').config();
const nodemailer = require('nodemailer');
const transport = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 2525,
    auth: {
      user: process.env.userr,
      pass: process.env.passs
    }
});

module.exports = transport
