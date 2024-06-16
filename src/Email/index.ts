import nodemailer from 'nodemailer'

export class Email {

    async sendEmail(to: string, subject: string, text: string) : Promise<void> {
        const transporter = nodemailer.createTransport({
           service: 'gmail',
           host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
                user: String(process.env.EMAIL),
                pass: String(process.env.EMAIL_PASSWORD)
            }
        });

         transporter.sendMail({
            from: String(process.env.EMAIL),
            to,
            subject,
            html: text
        }, (error, info) => {
            if (error) {
                console.error('Error sending email:', error);
            } else {
                console.log('Email sent:', info.response);
            }
        });
    }

} 
