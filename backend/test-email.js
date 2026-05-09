import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('Testing email configuration...\n');

// Check environment variables
console.log('EMAIL_HOST:', process.env.EMAIL_HOST);
console.log('EMAIL_PORT:', process.env.EMAIL_PORT);
console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? '***SET***' : '❌ NOT SET');
console.log('EMAIL_FROM:', process.env.EMAIL_FROM);
console.log('');

// Test nodemailer
console.log('Testing nodemailer.createTransport...');
try {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  console.log('✅ Transporter created successfully!');
  console.log('');
  
  // Verify connection
  console.log('Verifying SMTP connection...');
  transporter.verify((error, success) => {
    if (error) {
      console.log('❌ SMTP connection failed:', error.message);
      console.log('');
      console.log('Common issues:');
      console.log('1. EMAIL_PASSWORD is not set or incorrect');
      console.log('2. Gmail 2-Step Verification not enabled');
      console.log('3. App Password not generated');
      console.log('4. Network/firewall blocking SMTP');
    } else {
      console.log('✅ SMTP connection successful!');
      console.log('✅ Email system is ready to send emails!');
    }
    process.exit(error ? 1 : 0);
  });
} catch (error) {
  console.log('❌ Error creating transporter:', error.message);
  process.exit(1);
}
