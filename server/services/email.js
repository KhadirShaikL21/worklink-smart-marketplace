import nodemailer from 'nodemailer';
import env from '../config/env.js';

let transporter;
let transporterReady = false;

async function createTransporter() {
  if (transporter && transporterReady) return transporter;

  try {
    // Check if SMTP credentials are provided
    if (env.email.user && env.email.pass && env.email.host !== 'smtp.gmail.com' && env.email.host !== 'ethereal') {
      // Use provided SMTP credentials
      transporter = nodemailer.createTransport({
        host: env.email.host,
        port: env.email.port,
        secure: env.email.secure,
        auth: {
          user: env.email.user,
          pass: env.email.pass
        }
      });

      // Verify connection
      await transporter.verify();
      transporterReady = true;
      console.log('✓ Email service ready (Custom SMTP)');
      return transporter;
    }

    if (env.email.user && env.email.pass && env.email.host === 'smtp.gmail.com') {
      // Gmail SMTP
      transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: env.email.user,
          pass: env.email.pass
        }
      });

      // Verify connection
      await transporter.verify();
      transporterReady = true;
      console.log('✓ Email service ready (Gmail SMTP)');
      return transporter;
    }

    // Fallback to Ethereal for testing
    console.warn('⚠ No SMTP credentials provided. Using Ethereal (test mode only)');
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });

    transporterReady = true;
    console.log('📧 Test Email Account:', {
      user: testAccount.user,
      pass: testAccount.pass,
      preview: 'https://ethereal.email'
    });

    return transporter;
  } catch (err) {
    console.error('✗ Email service initialization failed:', err.message);
    transporterReady = false;
    throw err;
  }
}

export async function sendEmail({ to, subject, html, text }) {
  try {
    console.log(`📧 Sending email to ${to}...`);
    const transport = await createTransporter();
    
    const info = await transport.sendMail({
      from: env.email.from || '"WorkLink" <noreply@worklink.com>',
      to,
      subject,
      text: text || html.replace(/<[^>]*>/g, ''),
      html
    });

    console.log('✓ Email sent successfully to:', to);
    console.log('   Message ID:', info.messageId);
    console.log('   Response:', info.response);
    
    if (!transporterReady || env.email.host === 'smtp.ethereal.email') {
      console.log('📧 Preview URL:', nodemailer.getTestMessageUrl(info));
    }

    return info;
  } catch (err) {
    console.error('✗ Email send failed for:', to);
    console.error('   Error:', err.message);
    console.error('   Full error:', err);
    throw new Error(`Email failed: ${err.message}`);
  }
}
