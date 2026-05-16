import nodemailer from 'nodemailer';

// Create reusable transporter
const createTransporter = () => {
  // Use createTransport (not createTransporter)
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false // Allow self-signed certificates
    }
  });

  return transporter;
};

// Send email function
export const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending email:', error);
    throw new Error('Failed to send email');
  }
};

// Send OTP email
export const sendOTPEmail = async (email, otp, displayName) => {
  const subject = 'Verify Your Email - Polyglot Scribe';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .otp-box { background: white; border: 2px solid #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
        .otp-code { font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #667eea; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to Polyglot Scribe! 🎉</h1>
        </div>
        <div class="content">
          <p>Hi ${displayName || 'there'},</p>
          <p>Thank you for signing up! Please verify your email address by entering this code:</p>
          <div class="otp-box">
            <div class="otp-code">${otp}</div>
          </div>
          <p>This code will expire in ${process.env.OTP_EXPIRE_MINUTES || 60} minutes.</p>
          <p>If you didn't create an account, you can safely ignore this email.</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Polyglot Scribe. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({ to: email, subject, html });
};

// Send password reset email
export const sendPasswordResetEmail = async (email, resetToken, displayName) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  const subject = 'Reset Your Password - Polyglot Scribe';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Reset Your Password</h1>
        </div>
        <div class="content">
          <p>Hi ${displayName || 'there'},</p>
          <p>You requested to reset your password. Click the button below to set a new password:</p>
          <div style="text-align: center;">
            <a href="${resetUrl}" class="button">Reset Password</a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #667eea;">${resetUrl}</p>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request a password reset, you can safely ignore this email.</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Polyglot Scribe. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({ to: email, subject, html });
};

// Send general notification email
export const sendGeneralEmail = async (email, title, message, displayName) => {
  const subject = title || 'Notification from Polyglot Scribe';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #1f2937; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 20px auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; }
        .header { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 40px 20px; text-align: center; }
        .content { padding: 40px 30px; background: white; }
        .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
        h1 { margin: 0; font-size: 24px; font-weight: 700; }
        p { margin-bottom: 16px; font-size: 16px; color: #4b5563; }
        .message-box { background: #f3f4f6; border-left: 4px solid #3b82f6; padding: 20px; border-radius: 4px; margin: 20px 0; font-size: 16px; font-style: italic; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${title}</h1>
        </div>
        <div class="content">
          <p>Hi ${displayName || 'there'},</p>
          <div class="message-box">
            ${message}
          </div>
          <p>If you have any questions, feel free to reply to this email.</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Polyglot Scribe. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({ to: email, subject, html });
};

export default { sendEmail, sendOTPEmail, sendPasswordResetEmail, sendGeneralEmail };
