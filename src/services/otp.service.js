import crypto from 'crypto';
import { Resend } from 'resend';
import { env } from '../config/environment.js';
import OTPVerification from '../models/OTPVerification.js';

const OTP_EXPIRY_MINUTES = 5;
const OTP_MAX_ATTEMPTS = 5;

const buildOtpHash = (otp) => crypto.createHash('sha256').update(otp).digest('hex');

const generateNumericOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

const resendClient = env.resendApiKey ? new Resend(env.resendApiKey) : null;

const sendEmailOtp = async ({ email, otp, purpose }) => {
  if (!resendClient) {
    throw new Error('Email provider is not configured');
  }

  const purposeText = purpose === 'password_reset' ? 'password reset' : 'email verification';

  await resendClient.emails.send({
    from: env.resendFromEmail,
    to: email,
    subject: `Your Orjoin ${purposeText} code`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;">
        <h2>Orjoin</h2>
        <p>Use this code to complete your ${purposeText}:</p>
        <div style="font-size:30px;letter-spacing:4px;font-weight:700;background:#f4f4f4;padding:14px 18px;border-radius:8px;width:fit-content;">${otp}</div>
        <p>This code expires in ${OTP_EXPIRY_MINUTES} minutes.</p>
      </div>
    `
  });
};

export const createEmailOtp = async ({ email, purpose }) => {
  const normalizedEmail = email.trim().toLowerCase();
  const otp = generateNumericOtp();
  const otpHash = buildOtpHash(otp);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await OTPVerification.deleteMany({
    email: normalizedEmail,
    purpose,
    consumedAt: null
  });

  await OTPVerification.create({
    email: normalizedEmail,
    purpose,
    otpHash,
    expiresAt,
    maxAttempts: OTP_MAX_ATTEMPTS
  });

  await sendEmailOtp({ email: normalizedEmail, otp, purpose });
};

export const verifyEmailOtp = async ({ email, purpose, otp }) => {
  const normalizedEmail = email.trim().toLowerCase();
  const otpDoc = await OTPVerification.findOne({
    email: normalizedEmail
  }).sort({ createdAt: -1 });
  

  if (!otpDoc) {
    return { ok: false, status: 404, message: 'OTP request not found' };
  }

  if (otpDoc.expiresAt < new Date()) {
    return { ok: false, status: 400, message: 'OTP expired' };
  }

  if (otpDoc.attempts >= otpDoc.maxAttempts) {
    return { ok: false, status: 429, message: 'Maximum OTP attempts exceeded' };
  }

  const providedHash = buildOtpHash(otp);
  if (providedHash !== otpDoc.otpHash) {
    otpDoc.attempts += 1;
    await otpDoc.save();
    return {
      ok: false,
      status: 400,
      message: `Invalid OTP. ${Math.max(0, otpDoc.maxAttempts - otpDoc.attempts)} attempts remaining.`
    };
  }

  otpDoc.consumedAt = new Date();
  await otpDoc.save();

  return { ok: true };
};
