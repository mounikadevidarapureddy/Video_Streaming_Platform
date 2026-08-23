import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Play, Pause, Volume2, VolumeX, Maximize, Settings, Subtitles, HeartHandshake, Users, Lock, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function HlsPlayer({ video, chapters = [], subtitles = [], onOpenTip, onOpenWatchParty, onUnlockPpv }) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const { user } = useAuth();

  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [qualityLevels, setQualityLevels] = useState([]);
  const [selectedQuality, setSelectedQuality] = useState(-1);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [subtitlesEnabled, setSubtitlesEnabled] = useState(true);
  const [hoverTime, setHoverTime] = useState(null);
  const [hoverChapter, setHoverChapter] = useState(null);

  const isLocked = video.is_pay_per_view && (!user || user.subscription_tier === 'free');

  useEffect(() => {
    if (!video || !video.hls_url || isLocked) return;

    const mainStreamUrl = video.hls_url;
    const rawStreamUrl = video.raw_url || mainStreamUrl;

    const videoEl = videoRef.current;
    if (!videoEl) return;

    const setupDirectMp4 = (url) => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      videoEl.src = url;
      videoEl.load();
    };

    if (mainStreamUrl.includes('.m3u8') && Hls.isSupported()) {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }

      const hls = new Hls({
        autoStartLoad: true,
        startLevel: -1,
        enableWorker: true
      });
      hlsRef.current = hls;

      hls.loadSource(mainStreamUrl);
      hls.attachMedia(videoEl);

      hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
        setQualityLevels(data.levels || []);
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              console.warn('HLS stream error. Falling back to direct MP4 stream...');
              hls.destroy();
              setupDirectMp4(rawStreamUrl);
              break;
          }
        }
      });
    } else {
      setupDirectMp4(mainStreamUrl);
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }, [video, isLocked]);

  const togglePlay = () => {
    if (isLocked) return;
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => setIsPlaying(true))
            .catch((err) => {
              console.warn('Playback interrupted or blocked by browser policy:', err);
              setIsPlaying(false);
            });
        }
      }
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const cur = videoRef.current.currentTime;
      const dur = videoRef.current.duration || 1;
      setCurrentTime(cur);
      setDuration(dur);
      setProgress((cur / dur) * 100);
    }
  };

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    if (videoRef.current && duration > 0) {
      const newTime = pos * duration;
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      setProgress(pos * 100);
    }
  };

  const handleProgressHover = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    if (duration > 0) {
      const targetSec = pos * duration;
      setHoverTime(targetSec);

      const chapter = chapters.find((c, idx) => {
        const next = chapters[idx + 1];
        return targetSec >= c.timestamp_seconds && (!next || targetSec < next.timestamp_seconds);
      });
      setHoverChapter(chapter || null);
    }
  };

  const changeQuality = (levelIndex) => {
    setSelectedQuality(levelIndex);
    if (hlsRef.current) {
      hlsRef.current.currentLevel = levelIndex;
    }
    setShowQualityMenu(false);
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '00:00';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (!document.fullscreenElement) {
        videoRef.current.parentElement.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
    }
  };

  return (
    <div className="relative w-full bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/10 group">
      
      {/* Video Element */}
      <video
        ref={videoRef}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        poster={video.thumbnail_url}
        className="w-full aspect-video object-cover cursor-pointer"
        onClick={togglePlay}
      >
        {subtitles.map((sub, idx) => (
          <track
            key={idx}
            kind="subtitles"
            src={`http://localhost:5000${sub.vtt_url}`}
            srcLang={sub.language}
            label={sub.label}
            default={subtitlesEnabled && idx === 0}
          />
        ))}
      </video>

      {/* Pay-Per-View Locked Overlay */}
      {isLocked && (
        <div className="absolute inset-0 z-20 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-red-400" />
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 uppercase tracking-widest mb-2">
            Pay-Per-View Premium Content
          </span>
          <h3 className="text-2xl font-extrabold text-white mb-2 max-w-md">
            {video.title}
          </h3>
          <p className="text-xs text-gray-400 max-w-sm mb-6">
            Unlock instant full HD adaptive access to this exclusive creator premiere for ${video.ppv_price || '4.99'}.
          </p>
          <button
            onClick={() => onUnlockPpv(video)}
            className="glow-btn-red px-8 py-3.5 text-sm flex items-center gap-2 font-bold"
          >
            Unlock Stream for ${video.ppv_price || '4.99'}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* HLS / HD Quality Badge */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <span className="badge-hls shadow-md">
          {video.hls_url?.includes('.m3u8')
            ? (selectedQuality === -1 ? 'HLS AUTO 1080P' : `${qualityLevels[selectedQuality]?.height || 1080}P`)
            : '4K FULL HD'}
        </span>
        {video.is_live && (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-red-600 text-white flex items-center gap-1 shadow-lg shadow-red-600/50 animate-pulse">
            ● LIVE
          </span>
        )}
      </div>

      {/* Custom Player Controls Bar */}
      {!isLocked && (
        <div className="absolute bottom-0 inset-x-0 z-10 bg-gradient-to-t from-black/95 via-black/60 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          
          {/* Progress Timeline with Chapters */}
          <div
            onClick={handleSeek}
            onMouseMove={handleProgressHover}
            onMouseLeave={() => { setHoverTime(null); setHoverChapter(null); }}
            className="relative w-full h-3 bg-white/20 hover:h-4 rounded-full cursor-pointer transition-all mb-3 flex items-center"
          >
            <div
              className="h-full bg-gradient-to-r from-purple-600 to-pink-500 rounded-full relative"
              style={{ width: `${progress}%` }}
            />

            {chapters.map((chap, idx) => {
              const posPercent = duration > 0 ? (chap.timestamp_seconds / duration) * 100 : 0;
              return (
                <div
                  key={idx}
                  title={`${chap.title} (${formatTime(chap.timestamp_seconds)})`}
                  style={{ left: `${posPercent}%` }}
                  className="absolute top-0 bottom-0 w-1 bg-yellow-400 hover:w-2 hover:bg-yellow-300 z-10 transition-all"
                />
              );
            })}

            {hoverTime !== null && (
              <div
                style={{ left: `${(hoverTime / (duration || 1)) * 100}%` }}
                className="absolute bottom-6 -translate-x-1/2 bg-slate-900/90 border border-white/20 px-2.5 py-1 rounded-md text-[11px] font-bold text-white shadow-xl pointer-events-none whitespace-nowrap"
              >
                {hoverChapter ? `📍 ${hoverChapter.title} • ` : ''}
                {formatTime(hoverTime)}
              </div>
            )}
          </div>

          {/* Controls Buttons Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={togglePlay}
                className="text-white hover:text-purple-400 transition-colors p-1"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 fill-white ml-0.5" />}
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="text-gray-300 hover:text-white"
                >
                  {isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    setVolume(v);
                    if (videoRef.current) videoRef.current.volume = v;
                    setIsMuted(v === 0);
                  }}
                  className="w-16 h-1 accent-purple-500 cursor-pointer"
                />
              </div>

              <span className="text-xs font-semibold text-gray-300">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => onOpenTip(video)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-pink-500/20 text-pink-300 border border-pink-500/40 hover:bg-pink-500/30 transition-all"
              >
                <HeartHandshake className="w-4 h-4 text-pink-400" />
                <span>Tip Creator</span>
              </button>

              <button
                onClick={() => onOpenWatchParty(video)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 transition-all"
              >
                <Users className="w-4 h-4 text-cyan-400" />
                <span>Watch Party</span>
              </button>

              <button
                onClick={() => setSubtitlesEnabled(!subtitlesEnabled)}
                className={`p-1.5 rounded-lg transition-colors ${
                  subtitlesEnabled ? 'text-purple-400 bg-white/10' : 'text-gray-400 hover:text-white'
                }`}
                title="Toggle Captions"
              >
                <Subtitles className="w-5 h-5" />
              </button>

              {video.hls_url?.includes('.m3u8') && (
                <div className="relative">
                  <button
                    onClick={() => setShowQualityMenu(!showQualityMenu)}
                    className="p-1.5 rounded-lg text-gray-300 hover:text-white transition-colors"
                    title="Stream Quality Settings"
                  >
                    <Settings className="w-5 h-5" />
                  </button>

                  {showQualityMenu && (
                    <div className="absolute right-0 bottom-10 bg-slate-900 border border-white/15 rounded-xl shadow-2xl p-2 w-40 z-30 text-xs">
                      <span className="block px-3 py-1 font-bold text-gray-400 uppercase text-[10px]">
                        Select Bitrate Quality:
                      </span>
                      <button
                        onClick={() => changeQuality(-1)}
                        className={`w-full text-left px-3 py-1.5 rounded-lg font-semibold flex items-center justify-between ${
                          selectedQuality === -1 ? 'bg-purple-600 text-white' : 'text-gray-300 hover:bg-white/10'
                        }`}
                      >
                        Auto (Adaptive)
                      </button>
                      {qualityLevels.map((lvl, index) => (
                        <button
                          key={index}
                          onClick={() => changeQuality(index)}
                          className={`w-full text-left px-3 py-1.5 rounded-lg font-semibold flex items-center justify-between ${
                            selectedQuality === index ? 'bg-purple-600 text-white' : 'text-gray-300 hover:bg-white/10'
                          }`}
                        >
                          {lvl.height || '720'}p
                          <span className="text-[9px] text-gray-400">
                            {Math.round((lvl.bitrate || 0) / 1000)}k
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={toggleFullscreen}
                className="text-gray-300 hover:text-white transition-colors"
              >
                <Maximize className="w-5 h-5" />
              </button>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
