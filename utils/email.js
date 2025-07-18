const nodemailer = require('nodemailer');
const pug = require('pug') ;
const htmltoText = require('html-to-text');
const sgMail = require('@sendgrid/mail');

module.exports = class Email{
    constructor(user,url) {
       this.to = user.email;
       this.firstName = user.name.split(' ')[0];
       this.url = url;
       this.from = `Sree Nithya <${process.env.EMAIL_FROM}>`
    }

    newTransport(){
        if(process.env.NODE_ENV === 'production'){
            // //sendgrid with smtp
            // return nodemailer.createTransport({
            //     service: 'SendGrid',
            //     auth: {
            //         user: process.env.SENDGRID_USERNAME,
            //         pass: process.env.SENDGRID_PASSWORD
            //     }
            // });

            return null; //sendgrid web api
        }
        return nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            auth: {
                user: process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASSWORD
            }
        });
    }

    async send(template,subject){
        //1) render html based on a pug template
        const html = pug.renderFile(`${__dirname}/../views/emails/${template}.pug`,{
            firstName: this.firstName,
            url: this.url,
            subject: subject
        });

        //2) define email options
        const mailOptions = {
            from: this.from,
            to: this.to,
            subject: subject,
            html: html,
            text: htmltoText.htmlToText(html) //converting all html into a simple text
            //because some prefer text over html and it is also better for spam
        };

        //3) create a transport and send email
        // await this.newTransport().sendMail(mailOptions); - this is for sendgrid smtp
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        await sgMail.send(mailOptions);
        //this is for sendgrid webapi
    }

    async sendWelcome(){
        await this.send('welcome','Welcome to the Natours Family!');
    }

    async sendPasswordReset(){
        await this.send('passwordReset','Your password reset token (valid for only 10 minutes)');
    }
};