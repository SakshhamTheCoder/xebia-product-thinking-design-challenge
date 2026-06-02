import User from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { signToken, publicUser } from '../utils/token.js';
import { validate } from '../utils/validators.js';

export const register = asyncHandler(async (req, res) => {
  const { username, email, phone, password } = req.body;

  const errors = validate(req.body, ['username', 'email', 'phone', 'password']);
  if (Object.keys(errors).length) {
    return res.status(400).json({ message: 'Please fix the errors below', errors });
  }

  const profilePic = req.file ? `/uploads/${req.file.filename}` : '';

  const user = await User.create({
    username,
    email,
    phone,
    password,
    profilePic,
    role: 'learner',
  });

  const token = signToken(user);
  res.status(201).json({
    message: 'Welcome aboard! Your learning journey starts now.',
    token,
    user: publicUser(user),
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  if (!user.isActive) {
    return res.status(403).json({ message: 'Your account has been deactivated' });
  }

  const token = signToken(user);
  res.json({ token, user: publicUser(user) });
});
