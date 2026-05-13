import Transcription from '../models/Transcription.js';
import mongoose from 'mongoose';

/**
 * @desc    Get user-specific usage analytics
 * @route   GET /api/app/stats
 * @access  Private
 */
export const getUserStats = async (req, res) => {
  try {
    const userId = req.user._id;

    // 1. Total usage stats
    const totalUsage = await Transcription.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      { 
        $group: { 
          _id: null, 
          totalSeconds: { $sum: "$durationSeconds" }, 
          count: { $sum: 1 } 
        } 
      }
    ]);

    // 2. Language distribution
    const langDist = await Transcription.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      { 
        $group: { 
          _id: "$sourceLang", 
          value: { $sum: 1 } 
        } 
      },
      { $sort: { value: -1 } }
    ]);

    // 3. Usage over time (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const usageStats = await Transcription.aggregate([
      { 
        $match: { 
          userId: new mongoose.Types.ObjectId(userId),
          createdAt: { $gte: thirtyDaysAgo }
        } 
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          transcribed: { $sum: "$durationSeconds" },
          translated: { $sum: { $cond: [{ $ne: ["$targetLang", null] }, "$durationSeconds", 0] } }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    // Fill in gaps for the last 30 days
    const last30Days = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      
      const stat = usageStats.find(s => s._id === dateStr);
      
      last30Days.push({
        name: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        date: dateStr,
        transcribed: stat ? Math.round(stat.transcribed / 60) : 0,
        translated: stat ? Math.round(stat.translated / 60) : 0
      });
    }

    // Map language distribution to percentages
    const totalCount = totalUsage[0]?.count || 0;
    const formattedLangDist = langDist.map(l => ({
      name: l._id || 'English',
      value: totalCount > 0 ? Math.round((l.value / totalCount) * 100) : 0
    }));

    res.status(200).json({
      success: true,
      data: {
        totalMinutes: Math.round((totalUsage[0]?.totalSeconds || 0) / 60),
        totalCount,
        langDist: formattedLangDist,
        usageOverTime: last30Days
      }
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
