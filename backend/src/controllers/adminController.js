import User from '../models/User.js';
import Profile from '../models/Profile.js';
import UserRole from '../models/UserRole.js';
import UserToken from '../models/UserToken.js';
import Transcription from '../models/Transcription.js';
import SubscriptionPayment from '../models/SubscriptionPayment.js';
import SystemSetting from '../models/SystemSetting.js';


// @desc    Get all users with their details
// @route   GET /api/app/admin/users
// @access  Private (Admin only)
export const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password').lean();
    
    const usersWithDetails = await Promise.all(
      users.map(async (user) => {
        const profile = await Profile.findOne({ userId: user._id });
        const role = await UserRole.findOne({ userId: user._id });
        const token = await UserToken.findOne({ userId: user._id });
        const transcriptCount = await Transcription.countDocuments({ userId: user._id });

        return {
          userId: user._id,
          email: user.email,
          displayName: profile?.displayName || user.displayName,
          isAdmin: role?.role === 'admin',
          credits: token?.credits || 0,
          suspended: token?.suspended || false,
          featureLive: token?.featureLive !== false,
          featureFile: token?.featureFile !== false,
          featureYoutube: token?.featureYoutube !== false,
          featureTranslate: token?.featureTranslate !== false,
          featureTts: token?.featureTts !== false,
          transcriptCount,
          createdAt: user.createdAt,
        };
      })
    );

    res.json({
      success: true,
      data: {
        users: usersWithDetails,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user tokens/features
// @route   PATCH /api/app/admin/users/:userId/tokens
// @access  Private (Admin only)
export const updateUserTokens = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { credits, suspended, featureLive, featureFile, featureYoutube, featureTranslate, featureTts } = req.body;

    const token = await UserToken.findOne({ userId });
    if (!token) {
      return res.status(404).json({
        success: false,
        message: 'User token not found',
      });
    }

    if (credits !== undefined) token.credits = credits;
    if (suspended !== undefined) token.suspended = suspended;
    if (featureLive !== undefined) token.featureLive = featureLive;
    if (featureFile !== undefined) token.featureFile = featureFile;
    if (featureYoutube !== undefined) token.featureYoutube = featureYoutube;
    if (featureTranslate !== undefined) token.featureTranslate = featureTranslate;
    if (featureTts !== undefined) token.featureTts = featureTts;

    await token.save();

    res.json({
      success: true,
      message: 'User tokens updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle admin role
// @route   POST /api/app/admin/users/:userId/toggle-admin
// @access  Private (Admin only)
export const toggleAdminRole = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const role = await UserRole.findOne({ userId });
    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'User role not found',
      });
    }

    role.role = role.role === 'admin' ? 'user' : 'admin';
    await role.save();

    res.json({
      success: true,
      message: `User is now ${role.role}`,
      data: {
        role: role.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete all user transcriptions
// @route   DELETE /api/app/admin/users/:userId/transcriptions
// @access  Private (Admin only)
export const deleteUserTranscriptions = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const result = await Transcription.deleteMany({ userId });

    res.json({
      success: true,
      message: `Deleted ${result.deletedCount} transcriptions`,
      data: {
        deletedCount: result.deletedCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin create user (auto-verified)
// @route   POST /api/app/admin/users
// @access  Private (Admin only)
export const adminCreateUser = async (req, res, next) => {
  try {
    const { email, password, displayName, credits = 100 } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email",
      });
    }

    const user = await User.create({
      email,
      password,
      displayName,
      isEmailVerified: true,
      provider: "local",
    });

    await Profile.create({ userId: user._id, displayName, avatarUrl: null });
    await UserToken.create({ userId: user._id, credits });
    await UserRole.create({ userId: user._id, role: "user" });

    res.status(201).json({
      success: true,
      message: "User created successfully by admin",
      data: {
        userId: user._id,
        email: user.email,
        displayName: user.displayName,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user and all associated data
// @route   DELETE /api/app/admin/users/:userId
// @access  Private (Admin only)
export const adminDeleteUser = async (req, res, next) => {
  try {
    const { userId } = req.params;

    // Prevent deleting self
    if (userId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot delete your own admin account",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Delete associated data
    await Promise.all([
      Profile.deleteOne({ userId }),
      UserToken.deleteOne({ userId }),
      UserRole.deleteOne({ userId }),
      Transcription.deleteMany({ userId }),
      User.deleteOne({ _id: userId }),
    ]);

    res.json({
      success: true,
      message: "User and all associated data deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get admin statistics and analytics
// @route   GET /api/app/admin/stats
// @access  Private (Admin only)
export const getAdminStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalTranscriptions = await Transcription.countDocuments();
    
    // Revenue from successful payments
    const successfulPayments = await SubscriptionPayment.find({ status: 'success' });
    const totalRevenue = successfulPayments.reduce((sum, p) => sum + (p.amountEtb || 0), 0);

    // Get stats for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Transcription usage over time (last 30 days)
    const usageStats = await Transcription.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    // Revenue over time (last 30 days)
    const revenueStats = await SubscriptionPayment.aggregate([
      { $match: { status: 'success', createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          amount: { $sum: "$amountEtb" }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    // Map stats to a continuous 30-day range to avoid gaps in chart
    const last30Days = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      
      const usage = usageStats.find(s => s._id === dateStr)?.count || 0;
      const revenue = revenueStats.find(s => s._id === dateStr)?.amount || 0;
      
      last30Days.push({
        date: dateStr,
        usage,
        revenue
      });
    }

    res.json({
      success: true,
      data: {
        totalUsers,
        totalTranscriptions,
        totalRevenue,
        analytics: last30Days
      }
    });
  } catch (error) {
    next(error);
  }
};


// @desc    Get all system settings
// @route   GET /api/app/admin/settings
// @access  Private (Admin only)
export const getSystemSettings = async (req, res, next) => {
  try {
    const settings = await SystemSetting.find();
    
    // Default values if none exist
    const defaultSettings = {
      defaultUserCredits: 10,
      signupBonus: 0,
    };

    const formatted = settings.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});

    res.json({
      success: true,
      data: { ...defaultSettings, ...formatted },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update system settings
// @route   PATCH /api/app/admin/settings
// @access  Private (Admin only)
export const updateSystemSettings = async (req, res, next) => {
  try {
    const updates = req.body;

    for (const [key, value] of Object.entries(updates)) {
      await SystemSetting.findOneAndUpdate(
        { key },
        { key, value },
        { upsert: true, new: true }
      );
    }

    res.json({
      success: true,
      message: 'System settings updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getAllUsers,
  updateUserTokens,
  toggleAdminRole,
  deleteUserTranscriptions,
  adminCreateUser,
  adminDeleteUser,
  getAdminStats,
  getSystemSettings,
  updateSystemSettings,
};
