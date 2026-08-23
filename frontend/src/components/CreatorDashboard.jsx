import React, { useState, useEffect } from 'react';
import { Upload, Film, BarChart3, Settings, Edit3, Trash2, Plus, DollarSign, Eye, Clock, Sparkles, CheckCircle2, Tag } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function CreatorDashboard({ onSelectVideo, initialTab = 'analytics' }) {
  const { user, updateUserProfile } = useAuth();
  const [activeTab, setActiveTab] = useState(initialTab);

  const [analytics, setAnalytics] = useState(null);
  const [myVideos, setMyVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  const [categorySelect, setCategorySelect] = useState('Devotional');
  const [customCategory, setCustomCategory] = useState('');

  const [uploadMode, setUploadMode] = useState('file'); // 'file' or 'url'
  const [directStreamUrl, setDirectStreamUrl] = useState('');

  const [uploadData, setUploadData] = useState({
    title: '',
    description: '',
    tags: 'hd, streaming, video',
    is_pay_per_view: false,
    ppv_price: '4.99',
    thumbnail_url: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [transcodeStep, setTranscodeStep] = useState(0);

  const [editingVideo, setEditingVideo] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [editCategorySelect, setEditCategorySelect] = useState('General');
  const [editCustomCategory, setEditCustomCategory] = useState('');
  const [chapterModalVideo, setChapterModalVideo] = useState(null);
  const [newChapter, setNewChapter] = useState({ title: '', timestamp_seconds: '' });
  const [refundResult, setRefundResult] = useState(null);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [analyticsRes, videosRes] = await Promise.all([
        api.getCreatorAnalytics(),
        api.getVideos({ user_id: user.id })
      ]);
      setAnalytics(analyticsRes);
      setMyVideos(videosRes.videos || []);
    } catch (e) {
      console.error('Failed to load creator data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const handleUploadSubmit = async (e) => {
    e.preventDefault();

    if (!uploadData.title.trim()) {
      alert('Please enter a video title.');
      return;
    }

    if (uploadMode === 'file' && !selectedFile) {
      alert('Please choose a video file before publishing.');
      return;
    }

    setUploading(true);
    setTranscodeStep(1);

    try {
      const finalCategory = categorySelect === 'Other' ? (customCategory.trim() || 'General') : categorySelect;
      const formData = new FormData();

      if (uploadMode === 'file' && selectedFile) {
        formData.append('video', selectedFile);
      } else if (directStreamUrl.trim()) {
        formData.append('direct_url', directStreamUrl.trim());
      }

      formData.append('title', uploadData.title.trim());
      formData.append('description', uploadData.description || 'Uploaded via FLIXIT Creator Lounge');
      formData.append('category', finalCategory);
      formData.append('tags', uploadData.tags || 'video, stream, flixit');
      formData.append('is_pay_per_view', uploadData.is_pay_per_view);
      formData.append('ppv_price', uploadData.ppv_price);
      formData.append('thumbnail_url', uploadData.thumbnail_url || '');

      setTimeout(() => setTranscodeStep(2), 800);
      setTimeout(() => setTranscodeStep(3), 1600);

      await api.uploadVideo(formData);

      setTranscodeStep(4);
      setTimeout(() => {
        setUploading(false);
        setTranscodeStep(0);
        setUploadData({
          title: '',
          description: '',
          tags: 'hd, streaming, video',
          is_pay_per_view: false,
          ppv_price: '4.99',
          thumbnail_url: ''
        });
        setSelectedFile(null);
        setDirectStreamUrl('');
        setCategorySelect('Devotional');
        setCustomCategory('');
        setActiveTab('content');
        fetchDashboardData();
      }, 800);

    } catch (err) {
      alert('Upload failed: ' + err.message);
      setUploading(false);
      setTranscodeStep(0);
    }
  };

  const handleDeleteVideo = async (videoId) => {
    if (!window.confirm('Are you sure you want to delete this video?')) return;
    try {
      await api.deleteVideo(videoId);
      await fetchDashboardData();
    } catch (e) {
      alert('Delete failed: ' + e.message);
    }
  };

  const handleSaveVideoEdit = async (e) => {
    e.preventDefault();
    try {
      const finalCat = editCategorySelect === 'Other' ? (editCustomCategory.trim() || 'General') : editCategorySelect;
      await api.updateVideo(editingVideo.id, { ...editFormData, category: finalCat });
      setEditingVideo(null);
      await fetchDashboardData();
    } catch (e) {
      alert('Update failed: ' + e.message);
    }
  };

  const handleAddChapterSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.addChapter(chapterModalVideo.id, newChapter);
      setChapterModalVideo(null);
      setNewChapter({ title: '', timestamp_seconds: '' });
      fetchDashboardData();
      alert('Chapter marker added successfully!');
    } catch (e) {
      alert('Add chapter failed: ' + e.message);
    }
  };

  const handleCancelSubscription = async () => {
    if (!window.confirm('Are you sure you want to cancel your subscription mid-cycle? An automated prorated refund will be calculated.')) return;
    try {
      const res = await api.cancelSubscription();
      setRefundResult(res);
      updateUserProfile({ subscription_tier: 'free' });
    } catch (e) {
      alert('Cancellation failed: ' + e.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 animate-fadeIn">
      
      {/* Studio Header */}
      <div className="glass-panel p-6 md:p-8 border border-white/10 mb-8 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-purple-600/20 via-pink-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex items-center gap-4">
          <img
            src={user?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
            alt={user?.username}
            className="w-16 h-16 rounded-2xl border-2 border-purple-500 object-cover shadow-xl"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-white">{user?.username}'s Creator Studio</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
                {user?.subscription_tier} TIER
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1 max-w-md">{user?.bio || 'Manage video uploads, inspect audience retention, and analyze revenues.'}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 bg-white/5 p-1.5 rounded-2xl border border-white/10">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'analytics' ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/40' : 'text-gray-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Analytics
          </button>
          <button
            onClick={() => setActiveTab('content')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'content' ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/40' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Film className="w-4 h-4" />
            My Videos ({myVideos.length})
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'upload' ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/40' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Upload className="w-4 h-4" />
            Upload HLS Video
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'settings' ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/40' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Settings className="w-4 h-4" />
            Monetization Settings
          </button>
        </div>
      </div>

      {/* TAB 1: ANALYTICS */}
      {activeTab === 'analytics' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="glass-panel p-5 border-l-4 border-purple-500 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Total Views</span>
                <span className="text-2xl font-black text-white">{analytics?.summary?.total_views?.toLocaleString() || 0}</span>
              </div>
              <div className="p-3 rounded-2xl bg-purple-500/20 text-purple-400"><Eye className="w-6 h-6" /></div>
            </div>

            <div className="glass-panel p-5 border-l-4 border-pink-500 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Watch Time</span>
                <span className="text-2xl font-black text-white">{analytics?.summary?.watch_hours || 0} hrs</span>
              </div>
              <div className="p-3 rounded-2xl bg-pink-500/20 text-pink-400"><Clock className="w-6 h-6" /></div>
            </div>

            <div className="glass-panel p-5 border-l-4 border-green-500 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Total Revenue</span>
                <span className="text-2xl font-black text-emerald-400">${analytics?.summary?.total_revenue || '0.00'}</span>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400"><DollarSign className="w-6 h-6" /></div>
            </div>

            <div className="glass-panel p-5 border-l-4 border-cyan-500 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Creator Tips & PPV</span>
                <span className="text-2xl font-black text-cyan-300">${analytics?.summary?.tip_revenue || '0.00'}</span>
              </div>
              <div className="p-3 rounded-2xl bg-cyan-500/20 text-cyan-400"><Sparkles className="w-6 h-6" /></div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-panel p-6">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                Monthly Revenue Growth ($ USD)
              </h3>
              <div className="h-48 flex items-end gap-4 pt-6 px-4">
                {analytics?.monthlyRevenue?.map((m, idx) => {
                  const maxRev = Math.max(...analytics.monthlyRevenue.map(item => item.revenue), 100);
                  const heightPct = Math.max(15, (m.revenue / maxRev) * 100);
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                      <span className="text-[10px] font-bold text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">${m.revenue}</span>
                      <div
                        style={{ height: `${heightPct}%` }}
                        className="w-full bg-gradient-to-t from-emerald-600 via-purple-600 to-pink-500 rounded-t-lg group-hover:brightness-125 transition-all"
                      />
                      <span className="text-[11px] font-bold text-gray-400">{m.month}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="glass-panel p-6">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-400" />
                Audience Retention Curve (% Watched)
              </h3>
              <div className="h-48 flex items-end gap-3 pt-6 px-4">
                {analytics?.retentionCurve?.map((r, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                    <span className="text-[10px] font-bold text-purple-300 opacity-0 group-hover:opacity-100 transition-opacity">{r.retention}%</span>
                    <div
                      style={{ height: `${r.retention}%` }}
                      className="w-full bg-gradient-to-t from-purple-900 to-purple-500 rounded-t-lg group-hover:bg-purple-400 transition-all"
                    />
                    <span className="text-[10px] text-gray-400">{r.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MY VIDEOS */}
      {activeTab === 'content' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Uploaded Video Content ({myVideos.length})</h2>
            <button
              onClick={() => setActiveTab('upload')}
              className="glow-btn-purple px-4 py-2 text-xs flex items-center gap-2 font-bold"
            >
              <Plus className="w-4 h-4" /> Upload New Video
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {myVideos.map((vid) => (
              <div key={vid.id} className="glass-panel p-4 flex flex-col justify-between group">
                <div>
                  <div className="relative mb-3 rounded-2xl overflow-hidden aspect-video">
                    <video src={vid.raw_url || vid.hls_url} muted preload="metadata" aria-label={vid.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    <span className="absolute top-2 right-2 badge-hls">1080P HLS</span>
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 text-[10px] font-bold border border-purple-500/30">
                      {vid.category}
                    </span>
                  </div>
                  <h3 className="font-extrabold text-sm text-white line-clamp-1 mb-1">{vid.title}</h3>
                  <p className="text-xs text-gray-400 line-clamp-2 mb-3">{vid.description}</p>
                </div>

                <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                  <span className="text-[11px] text-gray-400">{vid.views} views</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setChapterModalVideo(vid)}
                      title="Add Chapter Marker"
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-cyan-400 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => { setEditingVideo(vid); setEditFormData({ ...vid }); setEditCategorySelect(vid.category || 'General'); }}
                      title="Edit Video Details"
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-purple-400 transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteVideo(vid.id)}
                      title="Delete Video"
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: UPLOAD VIDEO WITH CATEGORY SELECTION */}
      {activeTab === 'upload' && (
        <div className="max-w-2xl mx-auto glass-panel p-8">
          <h2 className="text-xl font-extrabold text-white mb-1">Upload & Package Video</h2>
          <p className="text-xs text-gray-400 mb-6">Transcode your video file into multi-bitrate HLS streams (360p, 720p, 1080p master playlist).</p>

          {transcodeStep > 0 && (
            <div className="mb-6 p-4 rounded-2xl bg-purple-950/40 border border-purple-500/30 text-xs">
              <div className="flex items-center justify-between text-purple-300 font-bold mb-2">
                <span>Transcoding Pipeline Status:</span>
                <span>Stage {transcodeStep} of 4</span>
              </div>
              <div className="w-full h-2 bg-purple-950 rounded-full overflow-hidden mb-2">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-400 transition-all duration-500"
                  style={{ width: `${transcodeStep * 25}%` }}
                />
              </div>
              <p className="text-[11px] text-gray-400">
                {transcodeStep === 1 && 'Uploading raw video file...'}
                {transcodeStep === 2 && 'Generating 360p & 720p HLS segments...'}
                {transcodeStep === 3 && 'Packaging 1080p stream & master.m3u8 manifest...'}
                {transcodeStep === 4 && '✅ Stream published successfully!'}
              </p>
            </div>
          )}

          <form onSubmit={handleUploadSubmit} className="space-y-4">
            {/* Upload Mode Selector */}
            <div className="flex items-center gap-2 p-1 bg-white/5 rounded-xl border border-white/10 text-xs font-bold mb-4">
              <button
                type="button"
                onClick={() => setUploadMode('file')}
                className={`flex-1 py-2 rounded-lg transition-all ${
                  uploadMode === 'file' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
                }`}
              >
                📁 Upload Local Video File
              </button>
              <button
                type="button"
                onClick={() => setUploadMode('url')}
                className={`flex-1 py-2 rounded-lg transition-all ${
                  uploadMode === 'url' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
                }`}
              >
                🔗 Enter Video Stream URL
              </button>
            </div>

            {uploadMode === 'file' ? (
              <div className="border-2 border-dashed border-white/20 rounded-2xl p-6 text-center hover:border-purple-500 transition-colors">
                <Upload className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => setSelectedFile(e.target.files[0])}
                  className="hidden"
                  id="videoFileInput"
                />
                <label htmlFor="videoFileInput" className="cursor-pointer text-xs text-gray-300 font-bold hover:text-white">
                  {selectedFile ? `Selected: ${selectedFile.name}` : 'Click here to choose Video File (MP4, MKV, WebM)'}
                </label>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Direct Video Stream URL (.mp4 / .m3u8)</label>
                <input
                  type="text"
                  placeholder="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
                  value={directStreamUrl}
                  onChange={(e) => setDirectStreamUrl(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white placeholder-gray-500 focus:border-purple-500"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Video Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. 4K Nature & Ocean Reef Symphony"
                value={uploadData.title}
                onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-sm text-white focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Description</label>
              <textarea
                rows={3}
                placeholder="Summary of video content..."
                value={uploadData.description}
                onChange={(e) => setUploadData({ ...uploadData, description: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-sm text-white focus:border-purple-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Category</label>
                <select
                  value={categorySelect}
                  onChange={(e) => setCategorySelect(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl p-2.5 text-sm text-white focus:border-purple-500"
                >
                  <option value="Devotional">Devotional</option>
                  <option value="Nature">Nature</option>
                  <option value="Comedy">Comedy</option>
                  <option value="Action">Action</option>
                  <option value="Thriller">Thriller</option>
                  <option value="Songs">Songs</option>
                  <option value="Trailers">Trailers</option>
                  <option value="Sci-Fi & Gaming">Sci-Fi & Gaming</option>
                  <option value="Other">✨ Other (Type Custom Category)</option>
                </select>

                {categorySelect === 'Other' && (
                  <div className="mt-2 relative">
                    <Tag className="w-4 h-4 text-purple-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="Type custom category name"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      className="w-full bg-purple-950/40 border border-purple-500/40 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-purple-300 focus:outline-none"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Thumbnail Image URL</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={uploadData.thumbnail_url}
                  onChange={(e) => setUploadData({ ...uploadData, thumbnail_url: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-sm text-white focus:border-purple-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={uploading}
              className="w-full glow-btn-purple py-3 text-sm flex items-center justify-center gap-2 font-bold"
            >
              {uploading ? 'Transcoding Video...' : 'Publish Video Stream'}
            </button>
          </form>
        </div>
      )}

      {/* TAB 4: MONETIZATION SETTINGS */}
      {activeTab === 'settings' && (
        <div className="max-w-2xl mx-auto glass-panel p-8 space-y-6">
          <h2 className="text-xl font-extrabold text-white">Creator Subscription & Monetization</h2>
          
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
            <div>
              <span className="text-xs text-gray-400 font-semibold block">Current Subscription Tier:</span>
              <span className="text-lg font-black text-purple-400 uppercase">{user?.subscription_tier}</span>
            </div>
            {user?.subscription_tier !== 'free' && (
              <button
                onClick={handleCancelSubscription}
                className="px-4 py-2 rounded-xl bg-red-500/20 text-red-300 border border-red-500/40 text-xs font-bold"
              >
                Cancel Subscription (Prorated Refund)
              </button>
            )}
          </div>

          {refundResult && (
            <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-xs space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <CheckCircle2 className="w-5 h-5" />
                <span>Automated Prorated Refund Issued!</span>
              </div>
              <p className="text-gray-300">{refundResult.details}</p>
              <span className="block font-black text-emerald-300 text-sm">Refund Amount: ${refundResult.prorated_refund}</span>
            </div>
          )}
        </div>
      )}

      {/* EDIT VIDEO MODAL */}
      {editingVideo && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel p-6 max-w-lg w-full">
            <h3 className="text-lg font-bold text-white mb-4">Edit Video Details</h3>
            <form onSubmit={handleSaveVideoEdit} className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-300 mb-1">Title</label>
                <input
                  type="text"
                  value={editFormData.title || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white"
                />
              </div>
              <div>
                <label className="block text-gray-300 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editFormData.description || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white"
                />
              </div>
              <div>
                <label className="block text-gray-300 mb-1">Category</label>
                <select
                  value={editCategorySelect}
                  onChange={(e) => setEditCategorySelect(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl p-2.5 text-white"
                >
                  <option value="Devotional">Devotional</option>
                  <option value="Nature">Nature</option>
                  <option value="Comedy">Comedy</option>
                  <option value="Action">Action</option>
                  <option value="Thriller">Thriller</option>
                  <option value="Songs">Songs</option>
                  <option value="Trailers">Trailers</option>
                  <option value="Sci-Fi & Gaming">Sci-Fi & Gaming</option>
                  <option value="Other">✨ Other (Type Custom Category)</option>
                </select>

                {editCategorySelect === 'Other' && (
                  <input
                    type="text"
                    placeholder="Type custom category name"
                    value={editCustomCategory}
                    onChange={(e) => setEditCustomCategory(e.target.value)}
                    className="w-full bg-purple-950/40 border border-purple-500/40 rounded-xl p-2 mt-2 text-white"
                  />
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button type="button" onClick={() => setEditingVideo(null)} className="px-4 py-2 rounded-xl bg-white/10 text-white font-bold">Cancel</button>
                <button type="submit" className="glow-btn-purple px-4 py-2 font-bold">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD CHAPTER MODAL */}
      {chapterModalVideo && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-white mb-2">Add Chapter Marker</h3>
            <p className="text-xs text-gray-400 mb-2">Video: {chapterModalVideo.title}</p>
            <form onSubmit={handleAddChapterSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-300 mb-1">Chapter Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Opening Scene"
                  value={newChapter.title}
                  onChange={(e) => setNewChapter({ ...newChapter, title: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white"
                />
              </div>
              <div>
                <label className="block text-gray-300 mb-1">Timestamp (Seconds)</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 45"
                  value={newChapter.timestamp_seconds}
                  onChange={(e) => setNewChapter({ ...newChapter, timestamp_seconds: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button type="button" onClick={() => setChapterModalVideo(null)} className="px-4 py-2 rounded-xl bg-white/10 text-white font-bold">Cancel</button>
                <button type="submit" className="glow-btn-purple px-4 py-2 font-bold">Add Marker</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
