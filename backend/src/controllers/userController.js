import fs from 'fs';
import path from 'path';
import User from '../models/User.js';
import Attempt from '../models/Attempt.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { publicUser } from '../utils/token.js';
import { validate } from '../utils/validators.js';
import { uploadsDir } from '../middleware/upload.js';

export const getMe = asyncHandler(async (req, res) => {
  res.json({ user: publicUser(req.user) });
});

export const updateMe = asyncHandler(async (req, res) => {
  const { username, phone } = req.body;

  const errors = validate({ username, phone }, ['username', 'phone']);
  if (Object.keys(errors).length) {
    return res.status(400).json({ message: 'Please fix the errors below', errors });
  }

  const user = req.user;
  user.username = username.trim();
  user.phone = phone.trim();
  if (req.file) user.profilePic = `/uploads/${req.file.filename}`;
  await user.save();

  res.json({ message: 'Profile updated', user: publicUser(user) });
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const errors = {};
  if (!currentPassword) errors.currentPassword = 'Current password is required';
  const pw = validate({ password: newPassword }, ['password']);
  if (pw.password) errors.newPassword = pw.password;
  if (Object.keys(errors).length) {
    return res.status(400).json({ message: 'Please fix the errors below', errors });
  }

  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.comparePassword(currentPassword))) {
    return res.status(400).json({
      message: 'Current password is incorrect',
      errors: { currentPassword: 'Current password is incorrect' },
    });
  }

  user.password = newPassword;
  await user.save();
  res.json({ message: 'Password changed successfully' });
});

export const deleteMe = asyncHandler(async (req, res) => {
  const user = req.user;

  if (user.role === 'admin') {
    const adminCount = await User.countDocuments({ role: 'admin' });
    if (adminCount <= 1) {
      return res.status(400).json({
        message:
          'You are the only admin. Promote another admin before deleting your account.',
      });
    }
  }

  if (user.profilePic && user.profilePic.startsWith('/uploads/')) {
    const file = path.join(uploadsDir, path.basename(user.profilePic));
    fs.promises.unlink(file).catch(() => {});
  }
  await Attempt.deleteMany({ learner: user._id });

  await user.deleteOne();
  res.json({ message: 'Account deleted' });
});
