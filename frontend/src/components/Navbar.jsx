import React, { useState } from 'react';
import { Play, Search, Users, Crown, LogOut, Menu, LogIn, UserPlus, Upload } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ onSearch, activeCategory, onSelectCategory, currentView, setCurrentView, toggleSidebar, dynamicCategories = [], onOpenUpload }) {
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  // Default + Requested Categories
  const baseCategories = ['All', 'Devotional', 'Nature', 'Comedy', 'Action', 'Thriller', 'Songs', 'Trailers'];
  const allCategories = Array.from(new Set([...baseCategories, ...dynamicCategories]));

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  const handleUploadClick = () => {
    if (onOpenUpload) {
      onOpenUpload();
    } else {
      setCurrentView(user ? 'dashboard' : 'login');
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-white/10 px-4 md:px-6 py-3 transition-all duration-300">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Toggle Sidebar & Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
            title="Toggle Navigation Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div 
            onClick={() => setCurrentView('browse')}
            className="flex items-center gap-2.5 cursor-pointer group shrink-0"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 via-pink-500 to-red-600 flex items-center justify-center shadow-lg shadow-purple-600/40 group-hover:scale-105 transition-transform">
              <Play className="w-4 h-4 text-white fill-white ml-0.5" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-red-500">
                FLIXIT
              </span>
              <span className="text-[9px] tracking-widest text-gray-400 font-semibold uppercase -mt-1">
                STREAM LOUNGE
              </span>
            </div>
          </div>

          {/* Category Filter Pills */}
          <nav className="hidden lg:flex items-center gap-1.5 ml-3 max-w-xl overflow-x-auto no-scrollbar">
            {allCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setCurrentView('browse');
                  onSelectCategory(cat);
                }}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  activeCategory === cat && currentView === 'browse'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/40'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {cat}
              </button>
            ))}
          </nav>
        </div>

        {/* Central Search Bar */}
        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md relative hidden sm:block">
          <input
            type="text"
            placeholder="Search devotional, nature, action, comedy, songs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-full py-2 pl-10 pr-4 text-xs text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-all"
          />
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        </form>

        {/* Action Controls & User Auth */}
        <div className="flex items-center gap-2">
          
          {/* Quick Upload Video Button */}
          <button
            onClick={handleUploadClick}
            className="glow-btn-purple px-3.5 py-1.5 text-xs flex items-center gap-1.5 font-extrabold shadow-lg shadow-purple-600/30"
            title="Upload New Video Stream"
          >
            <Upload className="w-3.5 h-3.5 text-white" />
            <span>+ Upload</span>
          </button>

          {/* Watch Party Button */}
          <button
            onClick={() => setCurrentView('watchparty')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-cyan-300 bg-cyan-950/40 border border-cyan-500/30 hover:bg-cyan-900/50 transition-all"
          >
            <Users className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span className="hidden md:inline">Watch Party</span>
          </button>

          {/* User Auth Status */}
          {user ? (
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full p-1 pl-2.5">
              <button
                onClick={() => setCurrentView('profile')}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <img
                  src={user.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=flixit_user'}
                  alt={user.username}
                  className="w-6 h-6 rounded-full border border-purple-500/50 object-cover"
                />
                <span className="text-xs font-bold text-white max-w-[80px] truncate hidden sm:inline">
                  {user.username}
                </span>
                {user.subscription_tier !== 'free' && (
                  <Crown className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                )}
              </button>

              <button
                onClick={logout}
                title="Sign Out"
                className="p-1 rounded-full hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors ml-1"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentView('login')}
                className="glow-btn-purple px-4 py-1.5 text-xs flex items-center gap-1.5 font-bold"
              >
                <LogIn className="w-3.5 h-3.5" />
                Sign In
              </button>
              <button
                onClick={() => setCurrentView('register')}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white border border-white/15 transition-all"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Register
              </button>
            </div>
          )}

        </div>
      </div>
    </header>
  );
}
