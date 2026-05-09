import Profile from '../models/Profile.js';
import UserToken from '../models/UserToken.js';
import UserRole from '../models/UserRole.js';

// @desc    Get current user profile
// @route   GET /api/app/profile
// @access  Private
export const getProfile = async (req, res, next) => {
  try {
    const profile = await Profile.findOne({ userId: req.user._id });
    const token = await UserToken.findOne({ userId: req.user._id });
    const role = await UserRole.findOne({ userId: req.user._id });

    res.json({
      success: true,
      data: {
        profile: profile || null,
        roles: role?.role === 'admin' ? ['admin'] : ['user'],
        tokens: {
          credits: token?.credits || 0,
          suspended: token?.suspended || false,
          featureLive: token?.featureLive !== false,
          featureFile: token?.featureFile !== false,
          featureYoutube: token?.featureYoutube !== false,
          featureTranslate: token?.featureTranslate !== false,
          featureTts: token?.featureTts !== false,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PATCH /api/app/profile
// @access  Private
export const updateProfile = async (req, res, next) => {
  try {
    const { displayName, avatarUrl, bio } = req.body;

    let profile = await Profile.findOne({ userId: req.user._id });

    if (!profile) {
      profile = await Profile.create({
        userId: req.user._id,
        displayName: displayName || req.user.displayName,
      });
    }

    if (displayName !== undefined) profile.displayName = displayName;
    if (avatarUrl !== undefined) profile.avatarUrl = avatarUrl;
    if (bio !== undefined) profile.bio = bio;

    await profile.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        profile,
      },
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getProfile,
  updateProfile,
};
