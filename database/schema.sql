-- ===================================================
-- FLIXIT Video Streaming Platform Database Schema
-- Compatible with MySQL 5.7+ / 8.0+
-- ===================================================

CREATE DATABASE IF NOT EXISTS flixit_db;
USE flixit_db;

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(255) DEFAULT '/avatars/default.png',
    bio TEXT,
    subscription_tier VARCHAR(20) DEFAULT 'free', -- 'free', 'premium', 'vip'
    stripe_customer_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. VIDEOS TABLE
CREATE TABLE IF NOT EXISTS videos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    category VARCHAR(50) DEFAULT 'General',
    hls_url VARCHAR(255) NOT NULL,
    thumbnail_url VARCHAR(255) NOT NULL,
    duration INT DEFAULT 0, -- in seconds
    views INT DEFAULT 0,
    is_pay_per_view BOOLEAN DEFAULT FALSE,
    ppv_price DECIMAL(10, 2) DEFAULT 0.00,
    is_live BOOLEAN DEFAULT FALSE,
    tags VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. VIDEO CHAPTERS TABLE
CREATE TABLE IF NOT EXISTS video_chapters (
    id INT AUTO_INCREMENT PRIMARY KEY,
    video_id INT NOT NULL,
    timestamp_seconds INT NOT NULL,
    title VARCHAR(100) NOT NULL,
    FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE
);

-- 4. VIDEO SUBTITLES / CAPTIONS TABLE
CREATE TABLE IF NOT EXISTS video_subtitles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    video_id INT NOT NULL,
    language VARCHAR(10) DEFAULT 'en',
    label VARCHAR(50) DEFAULT 'English',
    vtt_url VARCHAR(255) NOT NULL,
    FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE
);

-- 5. WATCH HISTORY TABLE
CREATE TABLE IF NOT EXISTS watch_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    video_id INT NOT NULL,
    watched_seconds INT DEFAULT 0,
    last_watched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE
);

-- 6. SUBSCRIPTIONS TABLE
CREATE TABLE IF NOT EXISTS subscriptions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    plan_name VARCHAR(50) NOT NULL,
    stripe_subscription_id VARCHAR(100),
    status VARCHAR(20) DEFAULT 'active',
    current_period_end TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 7. CREATOR TIPS TABLE
CREATE TABLE IF NOT EXISTS creator_tips (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sender_id INT NOT NULL,
    creator_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    message VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 8. WATCH PARTIES TABLE
CREATE TABLE IF NOT EXISTS watch_parties (
    id INT AUTO_INCREMENT PRIMARY KEY,
    room_code VARCHAR(36) NOT NULL UNIQUE,
    video_id INT NOT NULL,
    host_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE,
    FOREIGN KEY (host_id) REFERENCES users(id) ON DELETE CASCADE
);
