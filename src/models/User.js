import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      default: null
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      unique: true,
      sparse: true,
      trim: true,
      index: true
    },
    passwordHash: {
      type: String,
      default: null,
      select: false
    },
    referralCode: {
      type: String,
      trim: true,
      default: null
    },
    email: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
      index: true,
      default: null
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'prefer_not_to_say', null],
      default: null
    },
    address: {
      type: String,
      trim: true,
      default: null
    },
    profileCompleted: {
      type: Boolean,
      default: false
    },
    firebaseUid: {
      type: String,
      default: null,
      index: true
    },
    role: {
      type: String,
      enum: ['user', 'admin', 'editor', 'vendor'],
      default: 'user'
    }
  },
  {
    timestamps: true
  }
);

userSchema.pre('save', function (next) {
  next();
});

const User = mongoose.model('User', userSchema);

export default User;
