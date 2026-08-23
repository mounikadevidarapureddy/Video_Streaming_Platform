import React from 'react';
import { Home, Flame, Users, FolderHeart, Download, LayoutDashboard, User, Settings, Crown, Play, Upload } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ currentView, setCurrentView, isCollapsed, onOpenUpload }) {
  const { user } = useAuth();

  const navItems = [
    { id: 'browse', label: 'Home Feed', icon: Home },
    { id: 'trending', label: 'Trending 4K', icon: Flame },
    { id: 'watchparty', label: 'Watch Party', icon: Users },
    { id: 'playlists', label: 'My Playlists', icon: FolderHeart },
    { id: 'downloads', label: 'Offline Downloads', icon: Download },
  ];

  const userItems = [
    { id: 'upload_direct', label: 'Upload Video', icon: Upload, requiresAuth: false, isAction: true },
    { id: 'dashboard', label: 'Creator Studio', icon: LayoutDashboard, requiresAuth: true },
    { id: 'profile', label: 'Channel & Profile', icon: User, requiresAuth: true },
    { id: 'settings', label: 'Subscriptions', icon: Settings, requiresAuth: true },
  ];

  return (
    <aside className={`sticky top-[65px] h-[calc(100vh-65px)] glass-panel border-r border-white/10 p-3 transition-all duration-300 flex flex-col justify-between z-30 shrink-0 ${
      isCollapsed ? 'w-16' : 'w-64'
    }`}>
      
      {/* Top Main Navigation */}
      <div className="space-y-6">
        <div>
          {!isCollapsed && (
            <span className="block px-3 mb-2 text-[10px] font-extrabold uppercase tracking-widest text-gray-500">
              Discover Content
            </span>
          )}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id)}
                  title={item.label}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/40 border border-purple-400/30'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-purple-400'}`} />
                  {!isCollapsed && <span>{item.label}</span>}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Creator & Account Section */}
        <div>
          {!isCollapsed && (
            <span className="block px-3 mb-2 text-[10px] font-extrabold uppercase tracking-widest text-gray-500">
              Library & Studio
            </span>
          )}
          <nav className="space-y-1">
            {userItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              if (item.requiresAuth && !user) return null;

              const handleClick = () => {
                if (item.isAction && onOpenUpload) {
                  onOpenUpload();
                } else {
                  setCurrentView(item.id);
                }
              };

              return (
                <button
                  key={item.id}
                  onClick={handleClick}
                  title={item.label}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/40 border border-purple-400/30'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-pink-400'}`} />
                  {!isCollapsed && <span>{item.label}</span>}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Footer Subscription Banner */}
      {!isCollapsed && (
        <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-950/80 via-slate-900 to-slate-950 border border-purple-500/30 text-center space-y-2">
          <div className="flex items-center justify-center gap-1 text-xs font-black text-yellow-400">
            <Crown className="w-4 h-4 fill-yellow-400" />
            <span>FLIXIT VIP</span>
          </div>
          <p className="text-[10px] text-gray-400">Ad-Free 4K HLS Streams & Watch Parties</p>
          <button
            onClick={() => setCurrentView('settings')}
            className="w-full glow-btn-purple py-1.5 text-[11px] font-bold"
          >
            Upgrade Plan
          </button>
        </div>
      )}

    </aside>
  );
}
