import rateLimit from 'express-rate-limit';

const buildLimiter = ({ windowMs, max, message }) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message
    }
  });

export const loginLimiter = buildLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many login attempts. Please try again later.'
});

export const otpRequestLimiter = buildLimiter({
  windowMs: 15 * 60 * 1000,
  max: 8,
  message: 'Too many OTP requests. Please try again later.'
});
