import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'flixit_db';

let dbPool = null;
let useFallbackStore = false;

export const otpStore = new Map();

export const fallbackStore = {
  users: [],
  videos: [],
  video_chapters: [],
  video_subtitles: [],
  watch_history: [],
  subscriptions: [],
  creator_tips: [],
  watch_parties: []
};

// Seed 7 Category-Specific Free Web Stream Videos (1 Hour, 45 Min, 30 Min, 15 Min)
const initializeFallbackSeed = () => {
  if (fallbackStore.users.length === 0) {
    fallbackStore.users.push(
      {
        id: 1,
        username: 'flixit_admin',
        email: 'admin@flixit.com',
        password_hash: '$2a$10$wT5dYj0gX7E5b3z7.J8G9uQvM6gT5dYj0gX7E5b3z7.J8G9uQvM6g', // 'password'
        avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=flixit_admin',
        bio: 'Official FLIXIT Content Creator & Administrator',
        subscription_tier: 'vip',
        stripe_customer_id: 'cus_demo_admin',
        created_at: new Date()
      },
      {
        id: 2,
        username: 'cinephile_jane',
        email: 'jane@flixit.com',
        password_hash: '$2a$10$wT5dYj0gX7E5b3z7.J8G9uQvM6gT5dYj0gX7E5b3z7.J8G9uQvM6g',
        avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=cinephile_jane',
        bio: 'Film reviewer and tech enthusiast',
        subscription_tier: 'premium',
        stripe_customer_id: 'cus_demo_jane',
        created_at: new Date()
      }
    );

    fallbackStore.videos.push(
      {
        id: 1,
        user_id: 1,
        title: 'Funny Animal Shorts & Standup Special',
        description: 'Hilarious observational humor about modern life, technology, and funny animal antics.',
        category: 'Comedy',
        hls_url: '/videos/comedy2.mp4',
        raw_url: '/videos/comedy2.mp4',
        thumbnail_url: 'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=800&q=80',
        duration: 600,
        views: 52100,
        is_pay_per_view: 0,
        ppv_price: 0.00,
        is_live: 0,
        tags: 'comedy, standup, jokes, funny',
        created_at: new Date(Date.now() - 86400000 * 5)
      },
      {
        id: 2,
        user_id: 1,
        title: 'High-Octane Cyberpunk Action & Mech Battle',
        description: 'Sci-fi action film featuring mech battles and futuristic city combat.',
        category: 'Action',
        hls_url: '/videos/action1.mp4',
        raw_url: '/videos/action1.mp4',
        thumbnail_url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80',
        duration: 1800,
        views: 61800,
        is_pay_per_view: 0,
        ppv_price: 0.00,
        is_live: 0,
        tags: 'action, sci-fi, cyberpunk, battles',
        created_at: new Date(Date.now() - 86400000 * 3)
      },
      {
        id: 3,
        user_id: 2,
        title: 'Highway Chase & Supercar Showdown',
        description: 'Adrenaline-pumping action showcase of modified hypercars racing across desert highways.',
        category: 'Action',
        hls_url: '/videos/action2.mp4',
        raw_url: '/videos/action2.mp4',
        thumbnail_url: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=800&q=80',
        duration: 900,
        views: 54200,
        is_pay_per_view: 0,
        ppv_price: 0.00,
        is_live: 0,
        tags: 'action, cars, chase, speed',
        created_at: new Date(Date.now() - 86400000 * 2)
      },
      {
        id: 4,
        user_id: 2,
        title: 'Abyssal Deep Sea Mystery & Suspense Thriller',
        description: 'Psychological thriller exploring deep sea trench anomalies and submarine crew suspense.',
        category: 'Thriller',
        hls_url: '/videos/thriller1.mp4',
        raw_url: '/videos/thriller1.mp4',
        thumbnail_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
        duration: 2700,
        views: 41900,
        is_pay_per_view: 0,
        ppv_price: 0.00,
        is_live: 0,
        tags: 'thriller, mystery, deepsea, horror',
        created_at: new Date(Date.now() - 86400000 * 4)
      },
      {
        id: 5,
        user_id: 1,
        title: 'Psychological Crime Mystery & Night Detective',
        description: 'Tense detective investigation tracking a mastermind culprit through neon-lit alleys.',
        category: 'Thriller',
        hls_url: '/videos/thriller2.mp4',
        raw_url: '/videos/thriller2.mp4',
        thumbnail_url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80',
        duration: 2100,
        views: 33400,
        is_pay_per_view: 0,
        ppv_price: 0.00,
        is_live: 0,
        tags: 'thriller, detective, crime, noir',
        created_at: new Date(Date.now() - 86400000 * 3)
      },
      {
        id: 6,
        user_id: 1,
        title: 'Lofi Beats & Synthwave Concert (1 Hour Songs)',
        description: 'Continuous lofi music concert & chill synthwave songs for studying and relaxing.',
        category: 'Songs',
        hls_url: '/videos/songs1.mp4',
        raw_url: '/videos/songs1.mp4',
        thumbnail_url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80',
        duration: 3600,
        views: 84300,
        is_pay_per_view: 0,
        ppv_price: 0.00,
        is_live: 0,
        tags: 'songs, music, synthwave, lofi',
        created_at: new Date(Date.now() - 86400000 * 9)
      },
      {
        id: 7,
        user_id: 2,
        title: 'Acoustic Pop & EDM Festival Symphony',
        description: 'Electronic dance music concert featuring 4K stadium visuals and acoustic pop hits.',
        category: 'Songs',
        hls_url: '/videos/songs2.mp4',
        raw_url: '/videos/songs2.mp4',
        thumbnail_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80',
        duration: 1800,
        views: 61200,
        is_pay_per_view: 0,
        ppv_price: 0.00,
        is_live: 0,
        tags: 'songs, edm, festival, acoustic',
        created_at: new Date(Date.now() - 86400000 * 8)
      },
      {
        id: 8,
        user_id: 2,
        title: '2026 Blockbuster Movie & Gaming Teaser',
        description: 'High-bitrate compilation of upcoming 4K movie teasers, sci-fi premieres, and game trailers.',
        category: 'Trailers',
        hls_url: '/videos/trailers1.mp4',
        raw_url: '/videos/trailers1.mp4',
        thumbnail_url: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80',
        duration: 900,
        views: 88200,
        is_pay_per_view: 0,
        ppv_price: 0.00,
        is_live: 0,
        tags: 'trailers, movies, gaming, 4k',
        created_at: new Date()
      }
    );

    const localVideoFiles = [
      ['devotional.mp4', 'Devotional', 'Devotional Collection'],
      ['action.mp4', 'Action', 'Action Film Collection'],
      ['action1.mp4', 'Action', 'Cyberpunk Action and Mech Battle'],
      ['action2.mp4', 'Action', 'Highway Chase and Supercar Showdown'],
      ['comedy.mp4', 'Comedy', 'Comedy Collection'],
      ['comedy2.mp4', 'Comedy', 'Funny Animal Shorts'],
      ['thriller.mp4', 'Thriller', 'Thriller Collection'],
      ['thriller1.mp4', 'Thriller', 'Deep Sea Mystery'],
      ['thriller2.mp4', 'Thriller', 'Night Detective Mystery'],
      ['songs.mp4', 'Songs', 'Songs Collection'],
      ['songs1.mp4', 'Songs', 'Lofi Beats and Synthwave'],
      ['songs2.mp4', 'Songs', 'Acoustic Pop and EDM Festival'],
      ['trailers1.mp4', 'Trailers', 'Movie and Gaming Trailers']
    ];

    const availableLocalVideos = localVideoFiles.filter(([file]) => fs.existsSync(fileURLToPath(new URL(`../../frontend/public/videos/${file}`, import.meta.url))));

    fallbackStore.videos.splice(
      0,
      fallbackStore.videos.length,
      ...availableLocalVideos.map(([file, category, title], index) => ({
        id: index + 1,
        user_id: 1,
        title,
        description: `${title} video from the local FLIXIT library.`,
        category,
        hls_url: `/videos/${file}`,
        raw_url: `/videos/${file}`,
        thumbnail_url: '',
        duration: 0,
        views: 0,
        is_pay_per_view: 0,
        ppv_price: 0.00,
        is_live: 0,
        tags: category.toLowerCase(),
        created_at: new Date(Date.now() - index * 60000)
      }))
    );

    // Seed Chapters
    fallbackStore.video_chapters.push(
      { id: 1, video_id: 1, timestamp_seconds: 0, title: 'Opening Chants' },
      { id: 2, video_id: 1, timestamp_seconds: 600, title: 'Temple Bells & Flute' },
      { id: 3, video_id: 4, timestamp_seconds: 0, title: 'Lofi Intro Beats' },
      { id: 4, video_id: 4, timestamp_seconds: 1800, title: 'Synthwave Night Flight' },
      { id: 5, video_id: 7, timestamp_seconds: 0, title: 'Meet Big Buck Bunny' },
      { id: 6, video_id: 7, timestamp_seconds: 450, title: 'Bunny Revenge Plan' },
      { id: 7, video_id: 13, timestamp_seconds: 0, title: 'Cyberpunk Amsterdam' },
      { id: 8, video_id: 13, timestamp_seconds: 900, title: 'Mech Arena Assault' },
      { id: 9, video_id: 16, timestamp_seconds: 0, title: 'Rainforest Canopy' },
      { id: 10, video_id: 16, timestamp_seconds: 1800, title: 'Coral Reef Explorations' }
    );

    // Seed Subtitles
    fallbackStore.video_subtitles.push(
      { id: 1, video_id: 1, language: 'en', label: 'English Subtitles', vtt_url: '/uploads/subtitles/sample_en.vtt' },
      { id: 2, video_id: 4, language: 'en', label: 'English Subtitles', vtt_url: '/uploads/subtitles/sample_en.vtt' }
    );
  }
};

export const initDB = async () => {
  try {
    const connection = await mysql.createConnection({
      host: DB_HOST,
      user: DB_USER,
      password: DB_PASSWORD
    });

    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`;`);
    await connection.end();

    dbPool = mysql.createPool({
      host: DB_HOST,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    const schemaPath = fileURLToPath(new URL('../../database/schema.sql', import.meta.url));
    if (fs.existsSync(schemaPath)) {
      const sql = fs.readFileSync(schemaPath, 'utf8');
      const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);
      for (const stmt of statements) {
        await dbPool.query(stmt);
      }
    }

    console.log('✅ Successfully connected to MySQL database: ' + DB_NAME);
    useFallbackStore = false;
  } catch (err) {
    console.warn('⚠️ Could not connect to MySQL server (' + err.message + '). Switching to high-speed store for FLIXIT backend.');
    useFallbackStore = true;
    initializeFallbackSeed();
  }
};

export const isFallback = () => useFallbackStore;

export const queryDB = async (sql, params = []) => {
  if (!useFallbackStore && dbPool) {
    try {
      const [rows] = await dbPool.query(sql, params);
      return rows;
    } catch (err) {
      console.error('MySQL Query Error:', err);
      throw err;
    }
  }
  return null;
};
