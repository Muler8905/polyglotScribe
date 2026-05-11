import express from 'express';
import { body } from 'express-validator';
import {
  signup,
  verifyOTP,
  resendOTP,
  signin,
  signout,
  forgotPassword,
  resetPassword,
  getMe,
  refreshAccessToken,
  googleSignIn
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

// Validation rules
const signupValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('displayName').trim().notEmpty().withMessage('Display name is required')
];

const signinValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
];

const verifyOTPValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
];

const resendOTPValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email')
];

const forgotPasswordValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email')
];

const resetPasswordValidation = [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

const refreshTokenValidation = [
  body('refreshToken').notEmpty().withMessage('Refresh token is required')
];

// Routes
router.post('/signup', signupValidation, validate, signup);
router.post('/verify-otp', verifyOTPValidation, validate, verifyOTP);
router.post('/resend-otp', resendOTPValidation, validate, resendOTP);
router.post('/signin', signinValidation, validate, signin);
router.post('/signout', protect, signout);
router.post('/forgot-password', forgotPasswordValidation, validate, forgotPassword);
router.post('/reset-password', resetPasswordValidation, validate, resetPassword);
router.post('/refresh', refreshTokenValidation, validate, refreshAccessToken);
router.post('/google', googleSignIn);
router.get('/me', protect, getMe);

export default router;
