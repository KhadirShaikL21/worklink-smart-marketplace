import dotenv from 'dotenv';
dotenv.config();

import { sendEmail } from './services/email.js';

async function testEmail() {
  console.log('=== Email Service Test ===\n');
  
  console.log('Configuration:');
  console.log('HOST:', process.env.EMAIL_HOST || process.env.SMTP_HOST);
  console.log('PORT:', process.env.EMAIL_PORT || process.env.SMTP_PORT);
  console.log('USER:', process.env.EMAIL_USER || process.env.SMTP_USER);
  console.log('SECURE:', process.env.EMAIL_SECURE || process.env.SMTP_SECURE);
  console.log('FROM:', process.env.EMAIL_FROM);
  console.log('\nAttempting to send test email...\n');

  try {
    const result = await sendEmail({
      to: process.env.EMAIL_USER || process.env.SMTP_USER,
      subject: 'WorkLink Email Test',
      html: `
        <h2>Email Test Successful!</h2>
        <p>If you received this email, your email configuration is working correctly.</p>
        <p>Timestamp: ${new Date().toISOString()}</p>
      `
    });

    console.log('\n✅ EMAIL TEST PASSED!');
    console.log('Message ID:', result.messageId);
    console.log('\nEmail should arrive shortly at:', process.env.EMAIL_USER || process.env.SMTP_USER);
  } catch (err) {
    console.error('\n❌ EMAIL TEST FAILED!');
    console.error('Error:', err.message);
    console.error('\nFull error:');
    console.error(err);
    
    console.log('\n⚠️  TROUBLESHOOTING:');
    console.log('1. Check if EMAIL_USER and EMAIL_PASS are set correctly');
    console.log('2. For Gmail: Verify you are using an APP PASSWORD, not your regular password');
    console.log('3. Verify 2FA is enabled: https://myaccount.google.com/security');
    console.log('4. Create app password: https://myaccount.google.com/apppasswords');
  }

  process.exit(0);
}

testEmail();
