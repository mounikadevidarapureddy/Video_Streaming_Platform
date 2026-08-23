import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { queryDB, isFallback, fallbackStore } from '../config/db.js';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth.js';
import { processHlsTranscoding } from '../services/transcoder.js';

const router = express.Router();

// Multer Storage Configuration
const uploadDir = fileURLToPath(new URL('../../uploads', import.meta.url));
const rawVideoDir = path.join(uploadDir, 'raw');
if (!fs.existsSync(rawVideoDir)) {
  fs.mkdirSync(rawVideoDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, rawVideoDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'video-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 } // 500 MB limit
});

// GET ALL VIDEOS (With search, category filter, and tags)
router.get('/', optionalAuthMiddleware, async (req, res) => {
  try {
    const { search, category, user_id } = req.query;

    if (isFallback()) {
      let videos = [...fallbackStore.videos];

      if (category && category !== 'All') {
        videos = videos.filter(v => v.category.toLowerCase() === category.toLowerCase());
      }

      if (search) {
        const q = search.toLowerCase();
        videos = videos.filter(v => 
          v.title.toLowerCase().includes(q) || 
          v.description.toLowerCase().includes(q) ||
          (v.tags && v.tags.toLowerCase().includes(q))
        );
      }

      if (user_id) {
        videos = videos.filter(v => String(v.user_id) === String(user_id));
      }

      // Attach uploader info
      const result = videos.map(v => {
        const creator = fallbackStore.users.find(u => u.id === v.user_id) || { username: 'FLIXIT Creator', avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150' };
        return { ...v, username: creator.username, avatar_url: creator.avatar_url };
      });

      return res.json({ videos: result });
    } else {
      let sql = `
        SELECT v.*, u.username, u.avatar_url 
        FROM videos v 
        JOIN users u ON v.user_id = u.id 
        WHERE 1=1
      `;
      const params = [];

      if (category && category !== 'All') {
        sql += ' AND LOWER(v.category) = LOWER(?)';
        params.push(category);
      }

      if (search) {
        sql += ' AND (LOWER(v.title) LIKE ? OR LOWER(v.description) LIKE ? OR LOWER(v.tags) LIKE ?)';
        const q = `%${search.toLowerCase()}%`;
        params.push(q, q, q);
      }

      if (user_id) {
        sql += ' AND v.user_id = ?';
        params.push(user_id);
      }

      sql += ' ORDER BY v.created_at DESC';
      const rows = await queryDB(sql, params);
      return res.json({ videos: rows });
    }
  } catch (err) {
    console.error('Fetch videos error:', err);
    res.status(500).json({ error: 'Failed to retrieve videos.' });
  }
});

// GET VIDEO DETAILS (With chapters and subtitles)
router.get('/:id', optionalAuthMiddleware, async (req, res) => {
  try {
    const videoId = parseInt(req.params.id);

    if (isFallback()) {
      const video = fallbackStore.videos.find(v => v.id === videoId);
      if (!video) return res.status(404).json({ error: 'Video not found.' });

      const creator = fallbackStore.users.find(u => u.id === video.user_id) || { username: 'FLIXIT Creator' };
      const chapters = fallbackStore.video_chapters.filter(c => c.video_id === videoId);
      const subtitles = fallbackStore.video_subtitles.filter(s => s.video_id === videoId);

      // Increment views
      video.views += 1;

      return res.json({
        video: { ...video, username: creator.username, avatar_url: creator.avatar_url },
        chapters,
        subtitles
      });
    } else {
      const rows = await queryDB(
        `SELECT v.*, u.username, u.avatar_url, u.bio 
         FROM videos v 
         JOIN users u ON v.user_id = u.id 
         WHERE v.id = ?`,
        [videoId]
      );

      if (rows.length === 0) return res.status(404).json({ error: 'Video not found.' });

      const video = rows[0];
      await queryDB('UPDATE videos SET views = views + 1 WHERE id = ?', [videoId]);

      const chapters = await queryDB('SELECT * FROM video_chapters WHERE video_id = ? ORDER BY timestamp_seconds ASC', [videoId]);
      const subtitles = await queryDB('SELECT * FROM video_subtitles WHERE video_id = ?', [videoId]);

      return res.json({ video, chapters, subtitles });
    }
  } catch (err) {
    res.status(500).json({ error: 'Error fetching video details.' });
  }
});

// UPLOAD NEW VIDEO WITH HLS TRANSCODING & DIRECT STREAM PIPELINE
router.post('/upload', authMiddleware, upload.single('video'), async (req, res) => {
  try {
    const { title, description, category, tags, is_pay_per_view, ppv_price, thumbnail_url, direct_url } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Video title is required.' });
    }

    let hlsUrl = '';
    let rawUrl = '';

    if (req.file) {
      const videoId = Date.now();
      const hlsFolder = path.join(uploadDir, 'hls', `video_${videoId}`);
      hlsUrl = await processHlsTranscoding(req.file.path, hlsFolder);
      rawUrl = `/uploads/raw/${path.basename(req.file.path)}`;
    } else if (direct_url) {
      hlsUrl = direct_url;
      rawUrl = direct_url;
    } else {
      // Default high quality sample fallback if neither file nor direct_url provided
      hlsUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';
      rawUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';
    }

    const defaultThumbnail = thumbnail_url || '';

    if (isFallback()) {
      const newVideo = {
        id: fallbackStore.videos.length + 1,
        user_id: req.user.id,
        title,
        description: description || 'Uploaded via FLIXIT Creator Lounge',
        category: category || 'General',
        hls_url: hlsUrl,
        raw_url: rawUrl,
        thumbnail_url: defaultThumbnail,
        duration: 300,
        views: 1,
        is_pay_per_view: is_pay_per_view === 'true' || is_pay_per_view === true ? 1 : 0,
        ppv_price: parseFloat(ppv_price) || 0.00,
        is_live: 0,
        tags: tags || 'video, stream, flixit',
        created_at: new Date()
      };

      fallbackStore.videos.unshift(newVideo);
      return res.status(201).json({ video: newVideo, message: 'Video published successfully!' });
    } else {
      const result = await queryDB(
        `INSERT INTO videos (user_id, title, description, category, hls_url, thumbnail_url, duration, views, is_pay_per_view, ppv_price, tags) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          req.user.id,
          title,
          description || '',
          category || 'General',
          hlsUrl,
          defaultThumbnail,
          300,
          1,
          is_pay_per_view === 'true' || is_pay_per_view === true ? 1 : 0,
          parseFloat(ppv_price) || 0.00,
          tags || ''
        ]
      );

      const createdVideo = {
        id: result.insertId,
        user_id: req.user.id,
        title,
        description,
        category,
        hls_url: hlsUrl,
        raw_url: rawUrl,
        thumbnail_url: defaultThumbnail,
        duration: 300,
        views: 1,
        is_pay_per_view: is_pay_per_view === 'true' || is_pay_per_view === true ? 1 : 0,
        ppv_price: parseFloat(ppv_price) || 0.00,
        tags
      };

      return res.status(201).json({ video: createdVideo, message: 'Video published successfully!' });
    }
  } catch (err) {
    console.error('Upload video error:', err);
    res.status(500).json({ error: 'Video publication failed: ' + err.message });
  }
});

// UPDATE VIDEO METADATA (Title, Description, Category, PPV, Thumbnail)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const videoId = parseInt(req.params.id);
    const { title, description, category, tags, is_pay_per_view, ppv_price, thumbnail_url } = req.body;

    if (isFallback()) {
      const video = fallbackStore.videos.find(v => v.id === videoId);
      if (!video) return res.status(404).json({ error: 'Video not found.' });
      if (video.user_id !== req.user.id) return res.status(403).json({ error: 'Unauthorized to edit this video.' });

      if (title) video.title = title;
      if (description !== undefined) video.description = description;
      if (category) video.category = category;
      if (tags !== undefined) video.tags = tags;
      if (is_pay_per_view !== undefined) video.is_pay_per_view = is_pay_per_view ? 1 : 0;
      if (ppv_price !== undefined) video.ppv_price = parseFloat(ppv_price);
      if (thumbnail_url) video.thumbnail_url = thumbnail_url;

      return res.json({ video, message: 'Video updated successfully!' });
    } else {
      const rows = await queryDB('SELECT user_id FROM videos WHERE id = ?', [videoId]);
      if (rows.length === 0) return res.status(404).json({ error: 'Video not found.' });
      if (rows[0].user_id !== req.user.id) return res.status(403).json({ error: 'Unauthorized to edit this video.' });

      await queryDB(
        `UPDATE videos 
         SET title = COALESCE(?, title), 
             description = COALESCE(?, description), 
             category = COALESCE(?, category), 
             tags = COALESCE(?, tags), 
             is_pay_per_view = COALESCE(?, is_pay_per_view), 
             ppv_price = COALESCE(?, ppv_price), 
             thumbnail_url = COALESCE(?, thumbnail_url) 
         WHERE id = ?`,
        [title, description, category, tags, is_pay_per_view, ppv_price, thumbnail_url, videoId]
      );

      return res.json({ message: 'Video updated successfully!' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to update video.' });
  }
});

// DELETE VIDEO
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const videoId = parseInt(req.params.id);

    if (isFallback()) {
      const index = fallbackStore.videos.findIndex(v => v.id === videoId);
      if (index === -1) return res.status(404).json({ error: 'Video not found.' });
      if (fallbackStore.videos[index].user_id !== req.user.id) {
        return res.status(403).json({ error: 'Unauthorized to delete this video.' });
      }

      fallbackStore.videos.splice(index, 1);
      return res.json({ message: 'Video deleted successfully!' });
    } else {
      const rows = await queryDB('SELECT user_id FROM videos WHERE id = ?', [videoId]);
      if (rows.length === 0) return res.status(404).json({ error: 'Video not found.' });
      if (rows[0].user_id !== req.user.id) return res.status(403).json({ error: 'Unauthorized to delete this video.' });

      await queryDB('DELETE FROM videos WHERE id = ?', [videoId]);
      return res.json({ message: 'Video deleted successfully!' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete video.' });
  }
});

// ADD CHAPTER TO VIDEO
router.post('/:id/chapters', authMiddleware, async (req, res) => {
  try {
    const videoId = parseInt(req.params.id);
    const { timestamp_seconds, title } = req.body;

    if (!title || timestamp_seconds === undefined) {
      return res.status(400).json({ error: 'Title and timestamp are required.' });
    }

    if (isFallback()) {
      const chapter = {
        id: fallbackStore.video_chapters.length + 1,
        video_id: videoId,
        timestamp_seconds: parseInt(timestamp_seconds),
        title
      };
      fallbackStore.video_chapters.push(chapter);
      return res.status(201).json({ chapter, message: 'Chapter marker added!' });
    } else {
      const result = await queryDB(
        'INSERT INTO video_chapters (video_id, timestamp_seconds, title) VALUES (?, ?, ?)',
        [videoId, parseInt(timestamp_seconds), title]
      );
      return res.status(201).json({ chapter: { id: result.insertId, video_id: videoId, timestamp_seconds, title }, message: 'Chapter marker added!' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to add chapter.' });
  }
});

export default router;
