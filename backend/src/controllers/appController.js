import User from "../models/User.js";
import Profile from "../models/Profile.js";
import UserToken from "../models/UserToken.js";
import UserRole from "../models/UserRole.js";
import Transcription from "../models/Transcription.js";
import HeroImage from "../models/HeroImage.js";

export const getProfile = async (req, res, next) => {
  try {
    const [profile, tokens, roles] = await Promise.all([
      Profile.findOne({ userId: req.user._id }),
      UserToken.findOne({ userId: req.user._id }),
      UserRole.find({ userId: req.user._id }),
    ]);
    res.json({
      success: true,
      data: {
        profile: profile
          ? { displayName: profile.displayName, avatarUrl: profile.avatarUrl }
          : { displayName: req.user.displayName, avatarUrl: null },
        tokens: tokens
          ? {
              credits: tokens.credits,
              suspended: tokens.suspended,
              featureLive: tokens.featureLive,
              featureFile: tokens.featureFile,
              featureYoutube: tokens.featureYoutube,
              featureTranslate: tokens.featureTranslate,
              featureTts: tokens.featureTts,
            }
          : null,
        roles: roles.map((r) => r.role),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const upsertProfile = async (req, res, next) => {
  try {
    const { displayName, avatarUrl } = req.body;
    const profile = await Profile.findOneAndUpdate(
      { userId: req.user._id },
      { displayName, avatarUrl: avatarUrl || null },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    await User.findByIdAndUpdate(req.user._id, { displayName: displayName || req.user.displayName });

    res.json({
      success: true,
      data: {
        profile: {
          displayName: profile.displayName,
          avatarUrl: profile.avatarUrl,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updatePassword = async (req, res, next) => {
  try {
    const { password } = req.body;
    const user = await User.findById(req.user._id).select("+password");
    user.password = password;
    await user.save();
    res.json({ success: true, message: "Password updated" });
  } catch (error) {
    next(error);
  }
};

export const listAdminUsers = async (req, res, next) => {
  try {
    const isAdmin = await UserRole.findOne({ userId: req.user._id, role: "admin" });
    if (!isAdmin) return res.status(403).json({ success: false, message: "Admin only" });

    const [profiles, roles, tokens, tx] = await Promise.all([
      Profile.find({}).lean(),
      UserRole.find({ role: "admin" }).lean(),
      UserToken.find({}).lean(),
      Transcription.aggregate([{ $group: { _id: "$userId", count: { $sum: 1 } } }]),
    ]);
    const adminIds = new Set(roles.map((r) => String(r.userId)));
    const tokenMap = new Map(tokens.map((t) => [String(t.userId), t]));
    const countMap = new Map(tx.map((t) => [String(t._id), t.count]));
    const users = profiles.map((p) => {
      const t = tokenMap.get(String(p.userId));
      return {
        userId: String(p.userId),
        displayName: p.displayName || null,
        isAdmin: adminIds.has(String(p.userId)),
        credits: t?.credits ?? 0,
        suspended: t?.suspended ?? false,
        featureLive: t?.featureLive ?? true,
        featureFile: t?.featureFile ?? true,
        featureYoutube: t?.featureYoutube ?? true,
        featureTranslate: t?.featureTranslate ?? true,
        featureTts: t?.featureTts ?? true,
        transcriptCount: countMap.get(String(p.userId)) ?? 0,
      };
    });
    res.json({ success: true, data: { users } });
  } catch (error) {
    next(error);
  }
};

export const updateUserTokens = async (req, res, next) => {
  try {
    const isAdmin = await UserRole.findOne({ userId: req.user._id, role: "admin" });
    if (!isAdmin) return res.status(403).json({ success: false, message: "Admin only" });
    const { userId } = req.params;
    const patch = req.body;
    const updated = await UserToken.findOneAndUpdate(
      { userId },
      { $set: patch },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

export const toggleAdminRole = async (req, res, next) => {
  try {
    const isAdmin = await UserRole.findOne({ userId: req.user._id, role: "admin" });
    if (!isAdmin) return res.status(403).json({ success: false, message: "Admin only" });
    const { userId } = req.params;
    const existing = await UserRole.findOne({ userId, role: "admin" });
    if (existing) {
      await UserRole.deleteOne({ _id: existing._id });
      return res.json({ success: true, data: { isAdmin: false } });
    }
    await UserRole.create({ userId, role: "admin" });
    return res.json({ success: true, data: { isAdmin: true } });
  } catch (error) {
    next(error);
  }
};

export const deleteUserTranscriptions = async (req, res, next) => {
  try {
    const isAdmin = await UserRole.findOne({ userId: req.user._id, role: "admin" });
    if (!isAdmin) return res.status(403).json({ success: false, message: "Admin only" });
    const { userId } = req.params;
    await Transcription.deleteMany({ userId });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

export const listHeroImages = async (req, res, next) => {
  try {
    const activeOnly = req.query.active === "true";
    const query = activeOnly ? { active: true } : {};
    const items = await HeroImage.find(query).sort({ sortOrder: 1, createdAt: 1 }).lean();
    res.json({ success: true, data: { items } });
  } catch (error) {
    next(error);
  }
};

export const createHeroImage = async (req, res, next) => {
  try {
    const isAdmin = await UserRole.findOne({ userId: req.user._id, role: "admin" });
    if (!isAdmin) return res.status(403).json({ success: false, message: "Admin only" });
    const item = await HeroImage.create(req.body);
    res.status(201).json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
};

export const updateHeroImage = async (req, res, next) => {
  try {
    const isAdmin = await UserRole.findOne({ userId: req.user._id, role: "admin" });
    if (!isAdmin) return res.status(403).json({ success: false, message: "Admin only" });
    const item = await HeroImage.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
};

export const deleteHeroImage = async (req, res, next) => {
  try {
    const isAdmin = await UserRole.findOne({ userId: req.user._id, role: "admin" });
    if (!isAdmin) return res.status(403).json({ success: false, message: "Admin only" });
    await HeroImage.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};
