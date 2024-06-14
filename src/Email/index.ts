import nodemailer from 'nodemailer'

export class Email {

    async sendEmail(to: string, subject: string, text: string) : Promise<void> {
        const transporter = nodemailer.createTransport({
           service: 'gmail',
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
        });
    }

} 