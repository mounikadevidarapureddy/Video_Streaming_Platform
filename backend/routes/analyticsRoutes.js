import express from 'express';
import { isFallback, fallbackStore, queryDB } from '../config/db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// GET CREATOR ANALYTICS OVERVIEW
router.get('/creator', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    if (isFallback()) {
      const userVideos = fallbackStore.videos.filter(v => v.user_id === userId);
      const totalViews = userVideos.reduce((acc, v) => acc + (v.views || 0), 0);
      const totalWatchSeconds = totalViews * 140; // average 140s per view
      const watchHours = Math.round((totalWatchSeconds / 3600) * 10) / 10;

      // Calculate revenue
      const ppvRevenue = userVideos.reduce((acc, v) => acc + (v.is_pay_per_view ? (v.views * v.ppv_price * 0.7) : 0), 0);
      const tips = fallbackStore.creator_tips.filter(t => t.creator_id === userId);
      const tipRevenue = tips.reduce((acc, t) => acc + parseFloat(t.amount || 0), 0);
      const subRevenue = userVideos.length > 0 ? (totalViews * 0.05) : 0;
      const totalRevenue = Math.round((ppvRevenue + tipRevenue + subRevenue) * 100) / 100;

      // Revenue monthly trend chart data
      const monthlyRevenue = [
        { month: 'Mar', revenue: Math.round(totalRevenue * 0.1) },
        { month: 'Apr', revenue: Math.round(totalRevenue * 0.18) },
        { month: 'May', revenue: Math.round(totalRevenue * 0.25) },
        { month: 'Jun', revenue: Math.round(totalRevenue * 0.4) },
        { month: 'Jul', revenue: Math.round(totalRevenue * 0.7) },
        { month: 'Aug', revenue: totalRevenue }
      ];

      // Audience Retention curve data
      const retentionCurve = [
        { time: '0:00', retention: 100 },
        { time: '0:30', retention: 88 },
        { time: '1:00', retention: 74 },
        { time: '1:30', retention: 65 },
        { time: '2:00', retention: 58 },
        { time: '2:30', retention: 49 },
        { time: '3:00', retention: 42 }
      ];

      return res.json({
        summary: {
          total_videos: userVideos.length,
          total_views: totalViews,
          watch_hours: watchHours,
          total_revenue: totalRevenue,
          ppv_revenue: Math.round(ppvRevenue * 100) / 100,
          tip_revenue: Math.round(tipRevenue * 100) / 100
        },
        monthlyRevenue,
        retentionCurve,
        topVideos: userVideos.slice(0, 5)
      });
    } else {
      const videoRows = await queryDB('SELECT * FROM videos WHERE user_id = ? ORDER BY views DESC', [userId]);
      const totalViews = videoRows.reduce((acc, v) => acc + (v.views || 0), 0);
      const watchHours = Math.round(((totalViews * 140) / 3600) * 10) / 10;
      
      const tipRows = await queryDB('SELECT SUM(amount) as total_tips FROM creator_tips WHERE creator_id = ?', [userId]);
      const tipRevenue = parseFloat(tipRows[0]?.total_tips || 0);

      const totalRevenue = Math.round((totalViews * 0.05 + tipRevenue) * 100) / 100;

      const monthlyRevenue = [
        { month: 'Mar', revenue: Math.round(totalRevenue * 0.1) },
        { month: 'Apr', revenue: Math.round(totalRevenue * 0.2) },
        { month: 'May', revenue: Math.round(totalRevenue * 0.4) },
        { month: 'Jun', revenue: Math.round(totalRevenue * 0.6) },
        { month: 'Jul', revenue: Math.round(totalRevenue * 0.85) },
        { month: 'Aug', revenue: totalRevenue }
      ];

      const retentionCurve = [
        { time: '0:00', retention: 100 },
        { time: '0:30', retention: 88 },
        { time: '1:00', retention: 74 },
        { time: '1:30', retention: 65 },
        { time: '2:00', retention: 58 },
        { time: '2:30', retention: 49 }
      ];

      return res.json({
        summary: {
          total_videos: videoRows.length,
          total_views: totalViews,
          watch_hours: watchHours,
          total_revenue: totalRevenue,
          tip_revenue: tipRevenue
        },
        monthlyRevenue,
        retentionCurve,
        topVideos: videoRows.slice(0, 5)
      });
    }
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ error: 'Failed to generate creator analytics.' });
  }
});

export default router;
