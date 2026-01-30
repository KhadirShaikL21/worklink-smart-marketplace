import nodemailer from 'nodemailer';
import env from '../config/env.js';

let transporter;

async function createTransporter() {
  if (transporter) return transporter;

  if (env.email.host === 'ethereal') {
    const testAccount = await nodemailer.createTestAccount();
    console.log('Ethereal Email Credentials:', {
      user: testAccount.user,
      pass: testAccount.pass,
      preview: 'https://ethereal.email'
    });
    
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
  } else {
    transporter = nodemailer.createTransport({
      host: env.email.host,
      port: env.email.port,
      secure: env.email.secure,
      auth: {
        user: env.email.user,
        pass: env.email.pass
      }
    });
  }
  return transporter;
}

export async function sendEmail({ to, subject, html, text }) {
  const transport = await createTransporter();
  
  const info = await transport.sendMail({
    from: env.email.from || '"WorkLink" <no-reply@worklink.com>',
    to,
    subject,
    text: text || html.replace(/<[^>]*>/g, ''), // Fallback plain text
    html
  });

  if (env.email.host === 'ethereal') {
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
  }

  return info;
}
