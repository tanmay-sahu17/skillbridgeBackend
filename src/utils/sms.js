import twilio from 'twilio';
import appConfig from '../config/app.config.js';

const { accountSid, authToken, phoneNumber } = appConfig.twilio;

// Initialize Twilio client only if credentials are provided
const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

/**
 * Sends an SMS using Twilio.
 * 
 * @param {string} to - The recipient's phone number (e.g., '+919876543210')
 * @param {string} body - The message content
 * @returns {Promise<object|null>} Twilio response object or null if failed/not configured
 */
export const sendSMS = async (to, body) => {
  try {
    if (!client) {
      console.warn('⚠️ Twilio is not configured. SMS not sent.');
      console.warn(`[SMS Mock] To: ${to} | Body: ${body}`);
      return null;
    }

    console.log(to, phoneNumber)
    const message = await client.messages.create({
      body,
      from: phoneNumber,
      to
    });

    console.log(`✅ SMS sent successfully to ${to}. SID: ${message.sid}`);
    return message;
  } catch (error) {
    console.error('❌ Error sending SMS:', error.message);
    throw error;
  }
};

/**
 * Helper to send OTP via SMS.
 * 
 * @param {string} to - The recipient's phone number
 * @param {string} otp - The OTP to send
 */
export const sendOtpSMS = async (to) => {
  // Twilio Trial Accounts require this predefined template name for 2FA
  const body = `sms_2fa`;
  return await sendSMS(to, body);
};
