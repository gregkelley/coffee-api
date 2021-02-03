const nodemailer = require('nodemailer');

const sendEmail = async options => {
    // 1. Create transporter
    const transporter = nodemailer.createTransport({
        // gmail is not a good idea for a production app
        // service: 'Gmail',
        // auth: {
        //     user: process.env.EMAIL_USERNAME,
        //     pass: process.env.EMAIL_PASSWORD
        // }
        // Activate in gmail "less secure app" option

        // can put all of these settings in config.env, but why.
        host: "smtp.mailtrap.io",
        port: 2525,
        auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD
        }
    });

    // 2. Define email options
    const mailOptions = {
        from: "Greg Kelley <gregkelley@yahoo.com>",
        to: options.email,
        subject: options.subject,
        text: options.message
        // html: 
    }

    // 3. Send the email with nodemailer
    await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;