import { createEmailOtp, verifyEmailOtp } from '../services/otp.service.js';

// Compatibility wrappers for older imports.
export const sendEmailOTP = async (email, otp) => {
  if (!otp) {
    await createEmailOtp({ email, purpose: 'email_verification' });
    return;
  }

  throw new Error('Direct OTP sending with explicit code is no longer supported');
};

export const sendPhoneOTP = async () => {
  throw new Error('Phone OTP flow is deprecated');
};

export { verifyEmailOtp };

