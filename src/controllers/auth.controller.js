import bcrypt from 'bcrypt';
import User from '../models/User.js';
import { issueAuthTokens } from '../services/jwt.service.js';
import { createEmailOtp, verifyEmailOtp } from '../services/otp.service.js';
import { formatBangladeshiPhone, isValidBangladeshiPhone } from '../utils/phoneValidator.js';

const STATIC_ADMIN_EMAIL = 'admin@orjon.com';
const STATIC_ADMIN_PASSWORD = 'orjon12133';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name || null,
  phone: user.phone || null,
  email: user.email || null,
  role: user.role,
  referralCode: user.referralCode || null,
  profileCompleted: Boolean(user.profileCompleted),
  gender: user.gender || null,
  address: user.address || null,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt
});

export const register = async (req, res, next) => {
  try {
    const { name, phone, password, referralCode } = req.body;
    const trimmedName = name?.trim();
    const rawPhone = phone?.trim();
    const trimmedReferralCode = referralCode?.trim();

    if (!trimmedName) {
      return res.status(400).json({ success: false, message: 'Name is required' });
    }

    if (!rawPhone) {
      return res.status(400).json({ success: false, message: 'Phone number is required' });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
    }

    if (!trimmedReferralCode) {
      return res.status(400).json({ success: false, message: 'Referral code is required' });
    }

    if (!isValidBangladeshiPhone(rawPhone)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Bangladeshi phone number. Please provide a valid phone number starting with +880, 880, or 01'
      });
    }

    const formattedPhone = formatBangladeshiPhone(rawPhone);

    const existingUser = await User.findOne({ phone: formattedPhone });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Phone number is already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await User.create({
      name: trimmedName,
      phone: formattedPhone,
      passwordHash,
      referralCode: trimmedReferralCode,
      isEmailVerified: false,
      profileCompleted: false,
      role: 'user'
    });

    const tokens = issueAuthTokens({
      userId: user._id,
      phone: user.phone,
      role: user.role
    });

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      ...tokens,
      user: sanitizeUser(user)
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { phone, password, email } = req.body;
    const rawPhone = phone?.trim();

    // Keep legacy static admin login alive for migration safety.
    if (email && password) {
      const normalizedEmail = email.trim().toLowerCase();
      if (normalizedEmail === STATIC_ADMIN_EMAIL && password === STATIC_ADMIN_PASSWORD) {
        const tokens = issueAuthTokens({
          role: 'admin',
          isStaticAdmin: true,
          email: STATIC_ADMIN_EMAIL
        });

        return res.status(200).json({
          success: true,
          message: 'Admin login successful',
          ...tokens,
          user: {
            id: 'static-admin',
            name: 'Admin',
            email: STATIC_ADMIN_EMAIL,
            role: 'admin',
            profileCompleted: true
          }
        });
      }
    }

    if (!rawPhone) {
      return res.status(400).json({ success: false, message: 'Phone number is required' });
    }

    if (!password) {
      return res.status(400).json({ success: false, message: 'Password is required' });
    }

    if (!isValidBangladeshiPhone(rawPhone)) {
      return res.status(400).json({ success: false, message: 'Invalid Bangladeshi phone number' });
    }

    const formattedPhone = formatBangladeshiPhone(rawPhone);
    const user = await User.findOne({ phone: formattedPhone }).select('+passwordHash');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Phone number is not registered' });
    }

    if (!user.passwordHash) {
      return res.status(403).json({
        success: false,
        message: 'Password is not set for this account. Please reset your password.',
      });
    }

    let passwordMatches = false;
    try {
      passwordMatches = await bcrypt.compare(password, user.passwordHash);
    } catch (bcryptError) {
      console.error('Bcrypt comparison error:', bcryptError);
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (!passwordMatches) {
      return res.status(401).json({ success: false, message: 'Password is wrong. Try Again' });
    }

    const tokens = issueAuthTokens({
      userId: user._id,
      phone: user.phone,
      role: user.role
    });

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      ...tokens,
      requiresProfileCompletion: !user.profileCompleted,
      user: sanitizeUser(user)
    });
  } catch (error) {
    next(error);
  }
};

export const verifyEmailOtpAfterProfile = async (req, res, next) => {
  try {
    const { otp } = req.body;

    if (!req.user || req.user._id === 'static-admin') {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (!otp?.trim()) {
      return res.status(400).json({ success: false, message: 'OTP is required' });
    }

    const user = await User.findById(req.user._id);
    if (!user || !user.email) {
      return res.status(404).json({ success: false, message: 'User email not found for verification' });
    }

    const verifyResult = await verifyEmailOtp({
      email: user.email,
      purpose: 'email_verification',
      otp: otp.trim()
    });

    if (!verifyResult.ok) {
      return res.status(verifyResult.status).json({ success: false, message: verifyResult.message });
    }

    user.isEmailVerified = true;
    user.emailVerificationPending = false;
    user.profileCompleted = true;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Email verified successfully',
      user: sanitizeUser(user)
    });
  } catch (error) {
    next(error);
  }
};

export const resetPasswordRequest = async (req, res, next) => {
  try {
    const { email } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();

    if (!normalizedEmail) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    if (!EMAIL_REGEX.test(normalizedEmail)) {
      return res.status(400).json({ success: false, message: 'Invalid email address' });
    }

    const user = await User.findOne({ email: normalizedEmail });

    if(!user){
        return res.status(404).json({ success: false, message: 'User with this email does not exist. Kindly complete your profile first.' });
    }
    if (user) {
      await createEmailOtp({ email: normalizedEmail, purpose: 'password_reset' });
    }

    return res.status(200).json({
      success: true,
      message: 'OTP has been sent.'
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { email, newPassword, confirmPassword } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();

    if (!normalizedEmail) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long' });
    }

    if (!confirmPassword) {
      return res.status(400).json({ success: false, message: 'Confirm password is required' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'New password and confirm password do not match' });
    }

    const user = await User.findOne({ email: normalizedEmail }).select('+passwordHash');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    await user.save();

    return res.status(200).json({ success: true, message: 'Password reset successful' });
  } catch (error) {
    next(error);
  }
};
