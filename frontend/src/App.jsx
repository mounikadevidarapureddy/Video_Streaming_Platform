import React, { useState, useEffect } from 'react';
import { Play, Sparkles, Flame, Crown, Users, Lock, ChevronRight, Download, HeartHandshake } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { api } from './services/api';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import HlsPlayer from './components/HlsPlayer';
import WatchPartyRoom from './components/WatchPartyRoom';
import CreatorDashboard from './components/CreatorDashboard';
import SubscriptionModal from './components/SubscriptionModal';
import TipModal from './components/TipModal';

// Dedicated Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import PlaylistsView from './pages/PlaylistsView';
import OfflineDownloadsView from './pages/OfflineDownloadsView';
import UserProfileSettingsView from './pages/UserProfileSettingsView';

function MainAppContent() {
  const { user } = useAuth();
  
  // Views: 'browse', 'trending', 'watchparty', 'playlists', 'downloads', 'dashboard', 'profile', 'settings', 'login', 'register', 'forgot-password'
  const [currentView, setCurrentView] = useState('browse');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  // Videos Data State
  const [videos, setVideos] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeVideo, setActiveVideo] = useState(null);
  const [activeChapters, setActiveChapters] = useState([]);
  const [activeSubtitles, setActiveSubtitles] = useState([]);

  const [dashboardInitialTab, setDashboardInitialTab] = useState('analytics');

  const handleOpenUpload = () => {
    if (!user) {
      setCurrentView('login');
    } else {
      setDashboardInitialTab('upload');
      setCurrentView('dashboard');
    }
  };

  // Modals State
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [isTipModalOpen, setIsTipModalOpen] = useState(false);
  const [tipVideoTarget, setTipVideoTarget] = useState(null);
  const [watchPartyRoomCode, setWatchPartyRoomCode] = useState(null);
  const [watchPartyVideoTarget, setWatchPartyVideoTarget] = useState(null);

  // Fetch Videos & Recommendations
  const loadVideos = async (search = '', category = selectedCategory) => {
    try {
      const params = {};
      if (search) params.search = search;
      if (category && category !== 'All') params.category = category;

      const [resVideos, resRecs] = await Promise.all([
        api.getVideos(params),
        api.getRecommendations()
      ]);

      const loaded = resVideos.videos || [];
      setVideos(loaded);
      setRecommendations(resRecs.recommendations || []);

      if (!activeVideo && loaded.length > 0) {
        handleSelectVideo(loaded[0]);
      }
    } catch (err) {
      console.error('Error fetching videos:', err);
    }
  };

  useEffect(() => {
    loadVideos('', selectedCategory);
  }, [selectedCategory]);

  const handleSelectVideo = async (vid) => {
    try {
      const res = await api.getVideoById(vid.id);
      setActiveVideo(res.video);
      setActiveChapters(res.chapters || []);
      setActiveSubtitles(res.subtitles || []);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
      setActiveVideo(vid);
    }
  };

  const handleOpenWatchParty = (vid) => {
    setWatchPartyVideoTarget(vid || activeVideo || videos[0]);
    setWatchPartyRoomCode('create_new');
  };

  const handleUnlockPpv = async (vid) => {
    if (!user) {
      setCurrentView('login');
      return;
    }
    try {
      const res = await api.unlockPpv(vid.id);
      alert(res.message);
      handleSelectVideo(vid);
    } catch (e) {
      alert('PPV unlock failed: ' + e.message);
    }
  };

  const handleOpenTip = (vid) => {
    if (!user) {
      setCurrentView('login');
      return;
    }
    setTipVideoTarget(vid);
    setIsTipModalOpen(true);
  };

  // Dedicated Full-Page Auth & Password Recovery Views
  if (currentView === 'login') {
    return (
      <LoginPage
        onNavigateRegister={() => setCurrentView('register')}
        onNavigateForgotPassword={() => setCurrentView('forgot-password')}
        onBackToBrowse={() => setCurrentView('browse')}
      />
    );
  }

  if (currentView === 'register') {
    return (
      <RegisterPage
        onNavigateLogin={() => setCurrentView('login')}
        onBackToBrowse={() => setCurrentView('browse')}
      />
    );
  }

  if (currentView === 'forgot-password') {
    return (
      <ForgotPasswordPage
        onNavigateLogin={() => setCurrentView('login')}
        onBackToBrowse={() => setCurrentView('browse')}
      />
    );
  }

  // Extract dynamic categories from videos
  const dynamicCategoryList = Array.from(new Set(videos.map(v => v.category).filter(Boolean)));

  return (
    <div className="min-h-screen bg-[#09090e] text-gray-100 flex flex-col font-sans selection:bg-purple-500 selection:text-white">
      
      {/* Top Navbar */}
      <Navbar
        onSearch={(q) => loadVideos(q, selectedCategory)}
        activeCategory={selectedCategory}
        onSelectCategory={(cat) => setSelectedCategory(cat)}
        currentView={currentView}
        setCurrentView={setCurrentView}
        toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        dynamicCategories={dynamicCategoryList}
        onOpenUpload={handleOpenUpload}
      />

      {/* Main Layout with Collapsible YouTube-style Sidebar */}
      <div className="flex flex-1 w-full">
        
        {/* Left Navigation Sidebar */}
        <Sidebar
          currentView={currentView}
          setCurrentView={(v) => {
            if (v === 'dashboard') setDashboardInitialTab('analytics');
            setCurrentView(v);
          }}
          isCollapsed={isSidebarCollapsed}
          onOpenUpload={handleOpenUpload}
        />

        {/* Dynamic Page Views Container */}
        <div className="flex-1 min-w-0">
          
          {/* VIEW: CREATOR STUDIO DASHBOARD & UPLOAD */}
          {(currentView === 'dashboard' || currentView === 'upload_direct' || currentView === 'upload') && (
            <CreatorDashboard
              initialTab={currentView === 'upload_direct' || currentView === 'upload' ? 'upload' : dashboardInitialTab}
              onSelectVideo={(vid) => {
                setCurrentView('browse');
                handleSelectVideo(vid);
              }}
            />
          )}

          {/* VIEW: MY PLAYLISTS */}
          {currentView === 'playlists' && (
            <PlaylistsView
              videos={videos}
              onSelectVideo={(vid) => {
                setCurrentView('browse');
                handleSelectVideo(vid);
              }}
            />
          )}

          {/* VIEW: OFFLINE DOWNLOADS */}
          {currentView === 'downloads' && (
            <OfflineDownloadsView
              videos={videos}
              onSelectVideo={(vid) => {
                setCurrentView('browse');
                handleSelectVideo(vid);
              }}
            />
          )}

          {/* VIEW: PROFILE & SETTINGS */}
          {(currentView === 'profile' || currentView === 'settings') && (
            <UserProfileSettingsView />
          )}

          {/* VIEW: WATCH PARTY ROOM */}
          {currentView === 'watchparty' && activeVideo && (
            <WatchPartyRoom
              video={activeVideo}
              roomCodeToJoin="create_new"
              onClose={() => setCurrentView('browse')}
            />
          )}

          {/* VIEW: BROWSE / TRENDING MAIN FEED (FALLBACK DEFAULT) */}
          {(currentView === 'browse' || currentView === 'trending' || !['dashboard', 'upload_direct', 'upload', 'playlists', 'downloads', 'profile', 'settings', 'watchparty'].includes(currentView)) && (
            <main className="max-w-7xl w-full mx-auto p-4 md:p-8 space-y-10">
              
              {/* Active Video HLS Stream Lounge */}
              {activeVideo && (
                <div className="space-y-4 animate-fadeIn">
                  <HlsPlayer
                    video={activeVideo}
                    chapters={activeChapters}
                    subtitles={activeSubtitles}
                    onOpenTip={handleOpenTip}
                    onOpenWatchParty={handleOpenWatchParty}
                    onUnlockPpv={handleUnlockPpv}
                  />

                  {/* Video Metadata & Creator Card */}
                  <div className="glass-panel p-6 border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          {activeVideo.category}
                        </span>
                        {activeVideo.is_pay_per_view ? (
                          <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                            Pay-Per-View (${activeVideo.ppv_price})
                          </span>
                        ) : null}
                      </div>
                      <h1 className="text-2xl font-black text-white">{activeVideo.title}</h1>
                      <p className="text-xs text-gray-400 mt-1 max-w-3xl leading-relaxed">{activeVideo.description}</p>
                    </div>

                    <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-6 shrink-0 w-full md:w-auto justify-between md:justify-start">
                      <div className="flex items-center gap-3">
                        <img
                          src={activeVideo.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=flixit_user'}
                          alt={activeVideo.username}
                          className="w-10 h-10 rounded-full border border-purple-500 object-cover"
                        />
                        <div>
                          <span className="text-xs font-extrabold text-white block">{activeVideo.username}</span>
                          <span className="text-[10px] text-gray-400">{activeVideo.views?.toLocaleString()} views</span>
                        </div>
                      </div>

                      <button
                        onClick={() => setIsSubModalOpen(true)}
                        className="glow-btn-purple px-4 py-2 text-xs flex items-center gap-1.5 font-bold"
                      >
                        <Crown className="w-3.5 h-3.5 text-yellow-300" />
                        Subscribe
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Collaborative Filtering Recommendations */}
              {recommendations.length > 0 && (
                <section className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-purple-400" />
                      <h2 className="text-lg font-black text-white tracking-wide">Recommended for You</h2>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                    {recommendations.map((vid) => (
                      <div
                        key={vid.id}
                        onClick={() => handleSelectVideo(vid)}
                        className="glass-panel video-card p-3 border border-white/10 group relative overflow-hidden"
                      >
                        <div className="relative aspect-video rounded-xl overflow-hidden mb-3">
                          <video
                            src={vid.raw_url || vid.hls_url}
                            muted
                            preload="metadata"
                            aria-label={vid.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/80 text-[10px] font-bold text-gray-200">
                            {vid.duration ? `${Math.floor(vid.duration / 60)}m` : 'HLS'}
                          </span>
                        </div>

                        <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[9px] font-bold border border-purple-500/30 mb-1 inline-block">
                          {vid.category}
                        </span>

                        <h3 className="font-extrabold text-sm text-white line-clamp-1 group-hover:text-purple-300 transition-colors">
                          {vid.title}
                        </h3>
                        <div className="flex items-center justify-between text-[11px] text-gray-400 mt-2">
                          <span>{vid.username}</span>
                          <span>{vid.views?.toLocaleString()} views</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Main Stream Feed */}
              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-red-500" />
                  <h2 className="text-lg font-black text-white tracking-wide">Trending HLS 4K Streams</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                  {videos.map((vid) => (
                    <div
                      key={vid.id}
                      onClick={() => handleSelectVideo(vid)}
                      className="glass-panel video-card p-3 border border-white/10 group relative overflow-hidden"
                    >
                      <div className="relative aspect-video rounded-xl overflow-hidden mb-3">
                          <video
                            src={vid.raw_url || vid.hls_url}
                            muted
                            preload="metadata"
                            aria-label={vid.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        {vid.is_pay_per_view ? (
                          <span className="absolute top-2 left-2 px-2.5 py-0.5 rounded-md bg-yellow-500 text-black text-[10px] font-extrabold flex items-center gap-1">
                            <Lock className="w-3 h-3" /> PPV ${vid.ppv_price}
                          </span>
                        ) : null}
                        <span className="absolute top-2 right-2 badge-hls">1080P HLS</span>
                      </div>

                      <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[9px] font-bold border border-purple-500/30 mb-1 inline-block">
                        {vid.category}
                      </span>

                      <h3 className="font-extrabold text-sm text-white line-clamp-1 group-hover:text-purple-300 transition-colors">
                        {vid.title}
                      </h3>
                      <p className="text-xs text-gray-400 line-clamp-2 mt-1">{vid.description}</p>
                    </div>
                  ))}
                </div>
              </section>

            </main>
          )}

        </div>
      </div>

      {/* Footer */}
      <footer className="glass-panel border-t border-white/10 py-6 text-center text-xs text-gray-400 z-10">
        <p className="font-semibold text-white">FLIXIT © 2026 - Enterprise Video Streaming & Transcoding Platform</p>
        <p className="text-[11px] text-gray-500 mt-1">Built with React.js, Node.js, Express, Socket.io, MySQL & HLS Multi-Bitrate Packaging.</p>
      </footer>

      {/* Modals */}
      <SubscriptionModal isOpen={isSubModalOpen} onClose={() => setIsSubModalOpen(false)} />
      <TipModal video={tipVideoTarget} isOpen={isTipModalOpen} onClose={() => setIsTipModalOpen(false)} />

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}
