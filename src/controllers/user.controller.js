import User from '../models/User.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALLOWED_ROLES = ['user', 'admin', 'editor', 'vendor'];

export const completeProfile = async (req, res, next) => {
  try {
    const { email, gender, address } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();

    if (!normalizedEmail) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    if (!EMAIL_REGEX.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email address'
      });
    }

    const existing = await User.findOne({ email: normalizedEmail, _id: { $ne: req.user._id } });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Email is already in use'
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.email = normalizedEmail;
    user.gender = gender || null;
    user.address = address?.trim() || null;
    user.isEmailVerified = false;
    user.emailVerificationPending = true;
    user.profileCompleted = false;

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Profile update successful.',
    });
  } catch (error) {
    next(error);
  }
};

export const seeProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({
      success: true,
      user: {
        name: user.name || null,
        email: user.email || null,
        phone: user.phone || null,
        gender: user.gender || null,
        address: user.address || null,
        referralCode: user.referralCode || null,
        profileCompleted: Boolean(user.profileCompleted),
        isEmailVerified: Boolean(user.isEmailVerified),
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    next(error);
  }
};

export const changeUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    const userId = req.params.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    if (!role?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Role is required'
      });
    }

    const normalizedRole = role.trim().toLowerCase();

    if (!ALLOWED_ROLES.includes(normalizedRole)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role. Allowed roles are: ${ALLOWED_ROLES.join(', ')}`
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.role = normalizedRole;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'User role updated successfully',
      user: {
        id: user._id,
        name: user.name || null,
        phone: user.phone || null,
        email: user.email || null,
        role: user.role,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    next(error);
  }
};
