import User from '../models/User.js';
import Profile from '../models/Profile.js';
import UserRole from '../models/UserRole.js';
import UserToken from '../models/UserToken.js';
import Transcription from '../models/Transcription.js';

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

export default {
  getAllUsers,
  updateUserTokens,
  toggleAdminRole,
  deleteUserTranscriptions,
};
