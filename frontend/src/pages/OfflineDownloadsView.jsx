import React, { useState } from 'react';
import { Download, WifiOff, CheckCircle2, Play, HardDrive, Trash2 } from 'lucide-react';

export default function OfflineDownloadsView({ videos, onSelectVideo }) {
  const [downloadedVideos, setDownloadedVideos] = useState([
    { ...videos[0], cacheSize: '142 MB', downloadedAt: 'Today, 2:15 PM' }
  ]);

  const handleDownloadNew = (vid) => {
    if (downloadedVideos.some(d => d.id === vid.id)) return;
    setDownloadedVideos([
      ...downloadedVideos,
      { ...vid, cacheSize: '185 MB', downloadedAt: 'Just now' }
    ]);
  };

  const handleRemoveDownload = (vidId) => {
    setDownloadedVideos(downloadedVideos.filter(d => d.id !== vidId));
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-wider mb-1">
            <WifiOff className="w-4 h-4" /> PWA Offline Cache Manager
          </div>
          <h1 className="text-3xl font-black text-white">Offline Downloads</h1>
        </div>

        <div className="glass-panel px-4 py-2 flex items-center gap-2 text-xs font-bold text-gray-300">
          <HardDrive className="w-4 h-4 text-cyan-400" />
          <span>Storage Used: 327 MB / 10 GB</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {downloadedVideos.map((vid) => (
          <div key={vid.id} className="glass-panel p-4 flex flex-col justify-between group">
            <div>
              <div className="relative mb-3 rounded-2xl overflow-hidden aspect-video">
                <video src={vid.raw_url || vid.hls_url} muted preload="metadata" aria-label={vid.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                <span className="absolute top-2 right-2 px-2.5 py-0.5 rounded-md bg-emerald-500 text-black text-[10px] font-extrabold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Offline Ready
                </span>
              </div>
              <h3 className="font-extrabold text-sm text-white line-clamp-1 mb-1">{vid.title}</h3>
              <p className="text-xs text-gray-400 line-clamp-2 mb-3">{vid.description}</p>
            </div>

            <div className="pt-3 border-t border-white/10 flex items-center justify-between">
              <span className="text-[11px] text-gray-400">{vid.cacheSize} • {vid.downloadedAt}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onSelectVideo(vid)}
                  className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1"
                >
                  <Play className="w-3.5 h-3.5 fill-white" /> Watch Offline
                </button>
                <button
                  onClick={() => handleRemoveDownload(vid.id)}
                  className="p-1.5 rounded-xl bg-white/5 hover:bg-red-500/20 text-red-400"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
