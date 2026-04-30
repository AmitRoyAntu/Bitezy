const nodemailer = require('nodemailer');

// Create a transporter using environment variables. If not configured, transporter will be null.
let transporter = null;
if (process.env.MAIL_HOST && process.env.MAIL_USER) {
    transporter = nodemailer.createTransport({
        host: process.env.MAIL_HOST,
        port: process.env.MAIL_PORT ? parseInt(process.env.MAIL_PORT, 10) : 587,
        secure: process.env.MAIL_SECURE === 'true' || process.env.MAIL_PORT === '465',
        auth: {
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_PASS,
        }
    });
}

/**
 * Send an email using configured transporter.
 * @param {{to:string,subject:string,text?:string,html?:string}} opts
 * @returns {Promise<boolean>} true if sent, false otherwise
 */
async function sendMail(opts) {
    if (!transporter) {
        console.warn('Mail transporter not configured. Skipping sendMail.');
        return false;
    }

    const from = process.env.MAIL_FROM || process.env.MAIL_USER;

    const mail = Object.assign({ from }, opts);

    const info = await transporter.sendMail(mail);
    // nodemailer returns an info object; treat absence as failure
    return !!info;
}

module.exports = { sendMail };
