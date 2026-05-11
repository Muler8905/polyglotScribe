import User from "../models/User.js";
import Profile from "../models/Profile.js";
import UserToken from "../models/UserToken.js";
import UserRole from "../models/UserRole.js";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../utils/jwt.js";
import { sendOTPEmail, sendPasswordResetEmail } from "../config/email.js";
import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const signup = async (req, res, next) => {
  try {
    console.log('[Signup] Received request');
    console.log('[Signup] Body:', JSON.stringify(req.body, null, 2));
    console.log('[Signup] Headers:', req.headers['content-type']);
    
    const { email, password, displayName } = req.body;

    // Log what we extracted
    console.log('[Signup] Extracted:', { email, password: password ? '***' : undefined, displayName });

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('[Signup] User already exists:', email);
      return res.status(400).json({
        success: false,
        message: "User already exists with this email",
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + (process.env.OTP_EXPIRE_MINUTES || 60) * 60 * 1000);
    const user = await User.create({
      email,
      password,
      displayName,
      emailVerificationToken: otp,
      emailVerificationExpires: otpExpires,
      isEmailVerified: false,
      provider: "local",
    });
    await Profile.create({ userId: user._id, displayName, avatarUrl: null });
    await UserToken.create({ userId: user._id });
    await UserRole.create({ userId: user._id, role: "user" });

    try {
      await sendOTPEmail(email, otp, displayName);
    } catch (emailError) {
      console.error("Failed to send OTP email:", emailError);
    }

    res.status(201).json({
      success: true,
      message: "User created successfully. Please verify your email.",
      data: {
        userId: user._id,
        email: user.email,
        displayName: user.displayName,
        needsVerification: true,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const verifyOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({
      email,
      emailVerificationToken: otp,
      emailVerificationExpires: { $gt: Date.now() },
    }).select("+emailVerificationToken +emailVerificationExpires");

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    user.lastLogin = new Date();
    await user.save();

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshTokens.push({
      token: refreshToken,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });
    await user.save();

    res.cookie('token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      success: true,
      message: "Email verified successfully",
      data: {
        user: {
          id: user._id,
          email: user.email,
          displayName: user.displayName,
          isEmailVerified: user.isEmailVerified,
        },
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    next(error);
  }
};

export const resendOTP = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    if (user.isEmailVerified) return res.status(400).json({ success: false, message: "Email already verified" });
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + (process.env.OTP_EXPIRE_MINUTES || 60) * 60 * 1000);
    user.emailVerificationToken = otp;
    user.emailVerificationExpires = otpExpires;
    await user.save();
    await sendOTPEmail(email, otp, user.displayName);
    res.json({ success: true, message: "OTP sent successfully" });
  } catch (error) {
    next(error);
  }
};

export const signin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select("+password");
    if (!user) return res.status(401).json({ success: false, message: "Invalid email or password" });

    const ok = await user.comparePassword(password);
    if (!ok) return res.status(401).json({ success: false, message: "Invalid email or password" });

    if (!user.isEmailVerified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email address.",
        needsVerification: true,
      });
    }

    user.lastLogin = new Date();
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    user.refreshTokens.push({ token: refreshToken, expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) });
    await user.save();

    res.cookie("token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      message: "Signed in successfully",
      data: {
        user: {
          id: user._id,
          email: user.email,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
          isEmailVerified: user.isEmailVerified,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const signout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await User.findByIdAndUpdate(req.user._id, { $pull: { refreshTokens: { token: refreshToken } } });
    }
    res.clearCookie("token");
    res.json({ success: true, message: "Signed out successfully" });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.json({
        success: true,
        message: "If an account exists with this email, a password reset link has been sent.",
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    try {
      await sendPasswordResetEmail(email, resetToken, user.displayName);
    } catch (e) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();
      throw new Error("Failed to send password reset email");
    }

    res.json({ success: true, message: "Password reset email sent" });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    }).select("+passwordResetToken +passwordResetExpires");

    if (!user) return res.status(400).json({ success: false, message: "Invalid or expired reset token" });
    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    res.json({ success: true, message: "Password reset successfully" });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const profile = await Profile.findOne({ userId: req.user._id });
    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
          isEmailVerified: user.isEmailVerified,
          provider: user.provider,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt,
        },
        profile: profile || null,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const googleSignIn = async (req, res, next) => {
  try {
    const { idToken, accessToken: googleAccessToken } = req.body;
    let payload;

    if (idToken) {
      const ticket = await client.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } else if (googleAccessToken) {
      const response = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${googleAccessToken}`);
      if (!response.ok) {
        throw new Error("Failed to fetch user info from Google");
      }
      payload = await response.json();
    } else {
      return res.status(400).json({ success: false, message: "Token is required" });
    }

    const { sub: googleId, email, name: displayName, picture: avatarUrl } = payload;

    if (!email) {
      return res.status(400).json({ success: false, message: "Email not provided by Google" });
    }

    let user = await User.findOne({ email });

    if (user) {
      // If user exists but doesn't have googleId, link it
      if (!user.googleId) {
        user.googleId = googleId;
        user.provider = 'google';
        if (avatarUrl && !user.avatarUrl) user.avatarUrl = avatarUrl;
        await user.save();
      }
    } else {
      // Create new user
      user = await User.create({
        email,
        displayName,
        googleId,
        avatarUrl,
        provider: 'google',
        isEmailVerified: true, // Google emails are verified
      });
      await Profile.create({ userId: user._id, displayName, avatarUrl });
      await UserToken.create({ userId: user._id });
      await UserRole.create({ userId: user._id, role: "user" });
    }

    user.lastLogin = new Date();
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    user.refreshTokens.push({ token: refreshToken, expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) });
    await user.save();

    res.cookie("token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      message: "Signed in with Google successfully",
      data: {
        user: {
          id: user._id,
          email: user.email,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
          isEmailVerified: user.isEmailVerified,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    console.error("Google sign-in error:", error);
    res.status(401).json({ success: false, message: "Invalid Google token" });
  }
};

export const refreshAccessToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ success: false, message: "Refresh token required" });
    const decoded = verifyRefreshToken(refreshToken);
    const user = await User.findOne({
      _id: decoded.userId,
      "refreshTokens.token": refreshToken,
      "refreshTokens.expiresAt": { $gt: new Date() },
    });
    if (!user) return res.status(401).json({ success: false, message: "Invalid refresh token" });
    const accessToken = generateAccessToken(user._id);
    res.json({ success: true, data: { accessToken } });
  } catch (error) {
    next(error);
  }
};

export default {
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
};
