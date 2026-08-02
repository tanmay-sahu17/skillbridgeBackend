import { Resend } from 'resend';
import { ApiError } from '../core/ApiError.js';
import { HTTP_STATUS } from '../constants/index.js';

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Send an email using Resend
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} html - HTML body of the email
 */
export const sendEmail = async (to, subject, html) => {
  try {
    const data = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'SkillBridge <onboarding@resend.dev>',
      to: [to],
      subject,
      html,
    });

    if (data.error) {
      console.error('Resend Error:', data.error);
      throw new Error(data.error.message);
    }

    return data;
  } catch (error) {
    console.error('Email send error:', error);
    throw new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to send email. Please try again later.'
    );
  }
};

/**
 * Generate a 6-digit numeric OTP
 * @returns {string} 6-digit OTP
 */
export const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};
