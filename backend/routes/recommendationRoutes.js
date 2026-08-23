import express from 'express';
import { isFallback, fallbackStore, queryDB } from '../config/db.js';
import { optionalAuthMiddleware } from '../middleware/auth.js';

const router = express.Router();

// GET COLLABORATIVE FILTERING RECOMMENDATIONS
router.get('/recommendations', optionalAuthMiddleware, async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;

    if (isFallback()) {
      let recommended = [...fallbackStore.videos];

      // If user is logged in, filter out videos they've heavily watched or highlight related tags
      if (userId) {
        const history = fallbackStore.watch_history.filter(h => h.user_id === userId);
        const watchedVideoIds = history.map(h => h.video_id);

        // Score videos by tag match & popularity
        recommended = recommended.sort((a, b) => {
          const aWatched = watchedVideoIds.includes(a.id) ? -5 : 5;
          const bWatched = watchedVideoIds.includes(b.id) ? -5 : 5;
          return (b.views + bWatched) - (a.views + aWatched);
        });
      } else {
        recommended.sort((a, b) => b.views - a.views);
      }

      // Attach uploader info
      const result = recommended.map(v => {
        const creator = fallbackStore.users.find(u => u.id === v.user_id) || { username: 'FLIXIT Creator' };
        return { ...v, username: creator.username, avatar_url: creator.avatar_url };
      });

      return res.json({ recommendations: result });
    } else {
      const rows = await queryDB(
        `SELECT v.*, u.username, u.avatar_url 
         FROM videos v 
         JOIN users u ON v.user_id = u.id 
         ORDER BY v.views DESC 
         LIMIT 10`
      );
      return res.json({ recommendations: rows });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch recommendations.' });
  }
});

export default router;
