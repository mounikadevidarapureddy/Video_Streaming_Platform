import React, { useState } from 'react';
import { FolderHeart, Plus, Play, Trash2, Film, Check } from 'lucide-react';

export default function PlaylistsView({ videos, onSelectVideo }) {
  const [playlists, setPlaylists] = useState([
    { id: 1, name: 'Watch Later', videos: [videos[0] || {}] },
    { id: 2, name: 'Sci-Fi Classics', videos: videos.slice(0, 2) }
  ]);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleCreatePlaylist = (e) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;
    setPlaylists([
      ...playlists,
      { id: Date.now(), name: newPlaylistName.trim(), videos: [] }
    ]);
    setNewPlaylistName('');
    setShowCreateModal(false);
  };

  const handleRemoveFromPlaylist = (playlistId, videoId) => {
    setPlaylists(playlists.map(pl => {
      if (pl.id === playlistId) {
        return { ...pl, videos: pl.videos.filter(v => v.id !== videoId) };
      }
      return pl;
    }));
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-purple-400 font-bold text-xs uppercase tracking-wider mb-1">
            <FolderHeart className="w-4 h-4" /> Personal Media Library
          </div>
          <h1 className="text-3xl font-black text-white">My Saved Playlists</h1>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="glow-btn-purple px-4 py-2.5 text-xs flex items-center gap-2 font-bold"
        >
          <Plus className="w-4 h-4" /> Create New Playlist
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {playlists.map((pl) => (
          <div key={pl.id} className="glass-panel p-6 border border-white/10 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
                <FolderHeart className="w-5 h-5 text-pink-400" />
                {pl.name} ({pl.videos.length} videos)
              </h2>
            </div>

            {pl.videos.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-500 flex flex-col items-center gap-2">
                <Film className="w-8 h-8 text-gray-600" />
                This playlist is currently empty.
              </div>
            ) : (
              <div className="space-y-3">
                {pl.videos.map((vid, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                    <div className="flex items-center gap-3">
                      <video src={vid.raw_url || vid.hls_url} muted preload="metadata" aria-label={vid.title} className="w-14 h-9 rounded-lg object-cover" />
                      <div>
                        <h3 className="font-bold text-xs text-white line-clamp-1">{vid.title}</h3>
                        <span className="text-[10px] text-gray-400">{vid.username}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onSelectVideo(vid)}
                        className="p-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs"
                      >
                        <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
                      </button>
                      <button
                        onClick={() => handleRemoveFromPlaylist(pl.id, vid.id)}
                        className="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 text-red-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-white mb-3">Create New Playlist</h3>
            <form onSubmit={handleCreatePlaylist} className="space-y-4 text-xs">
              <input
                type="text"
                required
                placeholder="Playlist Title (e.g. Favorite Movies)"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-purple-500 focus:outline-none"
              />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 rounded-xl bg-white/10 text-white font-bold">Cancel</button>
                <button type="submit" className="glow-btn-purple px-4 py-2 font-bold">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
