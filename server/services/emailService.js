/**
 * Email Service
 *
 * Handles sending emails for various purposes
 */

import nodemailer from "nodemailer";
import logger from "../utils/logger.js";

// Create reusable transporter
let transporter;

/**
 * Initialize email transporter
 */
const initializeTransporter = () => {
  // Check if already initialized
  if (transporter) return;

  // Create transporter based on environment
  if (process.env.NODE_ENV === "production") {
    // Production transporter (SMTP)
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  } else {
    // Development transporter (Ethereal)
    nodemailer
      .createTestAccount()
      .then((account) => {
        transporter = nodemailer.createTransport({
          host: account.smtp.host,
          port: account.smtp.port,
          secure: account.smtp.secure,
          auth: {
            user: account.user,
            pass: account.pass,
          },
        });
        logger.info("Ethereal email account created for development", {
          user: account.user,
          url: "https://ethereal.email",
        });
      })
      .catch((error) => {
        logger.error("Failed to create test email account:", error);
      });
  }
};

// Initialize transporter
initializeTransporter();

/**
 * Send an email
 * @param {Object} options - Email options
 * @returns {Promise<Object>} Email info
 */
export const sendEmail = async (options) => {
  try {
    // Initialize transporter if not already done
    if (!transporter) {
      initializeTransporter();

      // Wait for transporter to be created in development
      if (process.env.NODE_ENV !== "production") {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      // If still not available, throw error
      if (!transporter) {
        throw new Error("Email transporter not available");
      }
    }

    // Set default from address
    const from =
      options.from ||
      `"${process.env.EMAIL_FROM_NAME || "Chat Widget"}" <${process.env.EMAIL_FROM_ADDRESS || "noreply@example.com"}>`;

    // Send email
    const info = await transporter.sendMail({
      from,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });

    // Log preview URL in development
    if (process.env.NODE_ENV !== "production") {
      logger.info("Email preview URL:", {
        url: nodemailer.getTestMessageUrl(info),
      });
    }

    return info;
  } catch (error) {
    logger.error("Error sending email:", error);
    throw new Error("Failed to send email");
  }
};

/**
 * Send password reset email
 * @param {string} email - Recipient email
 * @param {string} name - Recipient name
 * @param {string} token - Reset token
 * @returns {Promise<Object>} Email info
 */
export const sendPasswordResetEmail = async (email, name, token) => {
  const resetUrl = `${process.env.PUBLIC_URL || "http://localhost:3000"}/reset-password/${token}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Password Reset</h2>
      <p>Hello ${name},</p>
      <p>You requested a password reset for your account. Click the button below to reset your password:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" style="background-color: #0066CC; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Reset Password</a>
      </div>
      <p>If you didn't request this, you can safely ignore this email.</p>
      <p>This link will expire in 1 hour.</p>
      <p>If the button doesn't work, copy and paste this URL into your browser:</p>
      <p style="word-break: break-all;">${resetUrl}</p>
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;" />
      <p style="color: #666; font-size: 12px;">This is an automated email. Please do not reply.</p>
    </div>
  `;

  const text = `
    Password Reset

    Hello ${name},

    You requested a password reset for your account. Please visit the following URL to reset your password:

    ${resetUrl}

    If you didn't request this, you can safely ignore this email.

    This link will expire in 1 hour.
  `;

  return sendEmail({
    to: email,
    subject: "Password Reset",
    text,
    html,
  });
};

/**
 * Send welcome email
 * @param {string} email - Recipient email
 * @param {string} name - Recipient name
 * @returns {Promise<Object>} Email info
 */
export const sendWelcomeEmail = async (email, name) => {
  const loginUrl = `${process.env.PUBLIC_URL || "http://localhost:3000"}/login`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Welcome to Chat Widget!</h2>
      <p>Hello ${name},</p>
      <p>Thank you for creating an account. We're excited to have you on board!</p>
      <p>With Chat Widget, you can:</p>
      <ul>
        <li>Create customized chat widgets for your website</li>
        <li>Configure context-aware responses</li>
        <li>Manage knowledge bases for your AI assistant</li>
        <li>And much more!</li>
      </ul>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${loginUrl}" style="background-color: #0066CC; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Log In to Your Account</a>
      </div>
      <p>If you have any questions, please don't hesitate to contact our support team.</p>
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;" />
      <p style="color: #666; font-size: 12px;">This is an automated email. Please do not reply.</p>
    </div>
  `;

  const text = `
    Welcome to Chat Widget!

    Hello ${name},

    Thank you for creating an account. We're excited to have you on board!

    With Chat Widget, you can:
    - Create customized chat widgets for your website
    - Configure context-aware responses
    - Manage knowledge bases for your AI assistant
    - And much more!

    Log in to your account here: ${loginUrl}

    If you have any questions, please don't hesitate to contact our support team.
  `;

  return sendEmail({
    to: email,
    subject: "Welcome to Chat Widget!",
    text,
    html,
  });
};
