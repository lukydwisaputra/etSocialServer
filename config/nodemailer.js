require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service : 'gmail',
    auth: {
        user: 'etsocial.official@gmail.com',
        pass : process.env.MAIL_SECRETS
    }
})

module.exports = {
    transporter
}
