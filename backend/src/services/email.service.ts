import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

/**
 * Email transporter — uses Gmail SMTP by default.
 */
const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST || 'smtp.gmail.com',
  port: env.SMTP_PORT || 587,
  secure: false, // true for 465, false for 587 (STARTTLS)
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

const FROM = env.SMTP_FROM || `ICR System <${env.SMTP_USER}>`;

/**
 * Send password reset email with the reset link.
 */
export const sendPasswordResetEmail = async (to: string, resetLink: string) => {
  // If SMTP is not configured, throw an error so the caller can fallback
  if (!env.SMTP_USER || !env.SMTP_PASS) {
    throw new Error('SMTP credentials not configured. Please add SMTP_USER and SMTP_PASS to .env');
  }

  const mailOptions = {
    from: FROM,
    to,
    subject: 'Password Reset — ICR System',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f4f7f6;
            margin: 0;
            padding: 0;
            color: #333;
          }
          .container {
            max-width: 600px;
            margin: 40px auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
          }
          .header {
            background-color: #0f172a; /* slate-900 */
            padding: 30px;
            text-align: center;
          }
          .header h1 {
            color: #ffffff;
            margin: 0;
            font-size: 24px;
            letter-spacing: 1px;
          }
          .content {
            padding: 40px 30px;
            line-height: 1.6;
          }
          .button-container {
            text-align: center;
            margin: 35px 0;
          }
          .button {
            background-color: #0d9488; /* teal-600 */
            color: #ffffff !important;
            text-decoration: none;
            padding: 14px 28px;
            border-radius: 6px;
            font-weight: 600;
            font-size: 16px;
            display: inline-block;
          }
          .fallback {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            padding: 15px;
            border-radius: 6px;
            font-size: 13px;
            word-break: break-all;
            color: #64748b;
          }
          .footer {
            background-color: #f8fafc;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #94a3b8;
            border-top: 1px solid #e2e8f0;
          }
          .warning {
            color: #ef4444;
            font-size: 13px;
            margin-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>ICR System</h1>
          </div>
          <div class="content">
            <h2 style="margin-top: 0; color: #1e293b;">Password Reset Request</h2>
            <p>Hello,</p>
            <p>We received a request to reset the password for your ICR System account. If you made this request, please click the button below to choose a new password:</p>
            
            <div class="button-container">
              <a href="${resetLink}" class="button">Reset Password</a>
            </div>
            
            <p style="font-size: 14px;"><strong>Note:</strong> This link will expire in 1 hour.</p>
            
            <p class="warning">If you did not request a password reset, please ignore this email. Your password will remain unchanged and your account is safe.</p>
            
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;">
            
            <p style="font-size: 13px; color: #64748b; margin-bottom: 5px;">If the button above doesn't work, copy and paste this link into your browser:</p>
            <div class="fallback">
              <a href="${resetLink}" style="color: #0d9488;">${resetLink}</a>
            </div>
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} Intelligent Code Reviewer. All rights reserved.<br>
            This is an automated message, please do not reply.
          </div>
        </div>
      </body>
      </html>
    `,
  };

  return transporter.sendMail(mailOptions);
};
