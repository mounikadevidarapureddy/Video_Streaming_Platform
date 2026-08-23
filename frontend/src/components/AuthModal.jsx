import React, { useState } from 'react';
import { X, Mail, Lock, User, Sparkles, LogIn, UserPlus, Popcorn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import popcornGirlImage from '../assets/popcorn_girl.png';

export default function AuthModal({ isOpen, onClose }) {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        await register(formData);
      } else {
        await login({ email: formData.email, password: formData.password });
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (email, password) => {
    setError('');
    setLoading(true);
    try {
      await login({ email, password });
      onClose();
    } catch (err) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-slate-950/90 border border-white/10 rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* LEFT SIDE: Auth Form */}
        <div className="p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-widest bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-purple-400" />
                Stream Without Limits
              </span>
            </div>

            <h2 className="text-3xl font-black text-white tracking-tight mb-1">
              {isRegister ? 'Join FLIXIT Today' : 'Welcome Back'}
            </h2>
            <p className="text-xs text-gray-400 mb-6">
              {isRegister
                ? 'Create an account to watch 4K streams, host watch parties & upload videos.'
                : 'Sign in to access your watch history, subscriptions, and creator studio.'}
            </p>

            {/* Tabs */}
            <div className="flex rounded-xl bg-white/5 p-1 mb-6 border border-white/10">
              <button
                type="button"
                onClick={() => { setIsRegister(false); setError(''); }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  !isRegister ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/40' : 'text-gray-400 hover:text-white'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setIsRegister(true); setError(''); }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  isRegister ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/40' : 'text-gray-400 hover:text-white'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                Register
              </button>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {isRegister && (
                <div>
                  <label className="block text-[11px] font-semibold text-gray-300 mb-1">Username</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. CinemaKing"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-all"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-gray-300 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="you@domain.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-300 mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full glow-btn-purple py-3 text-sm flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  isRegister ? 'Create Account' : 'Sign In Now'
                )}
              </button>
            </form>
          </div>

          {/* Quick Demo Logins */}
          <div className="mt-6 pt-4 border-t border-white/10">
            <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wider block mb-2">
              Instant Demo Logins:
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDemoLogin('admin@flixit.com', 'password')}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-purple-600/30 border border-white/10 text-xs text-gray-300 hover:text-white transition-all text-left"
              >
                👑 <span className="font-bold text-white">Admin / VIP</span>
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('jane@flixit.com', 'password')}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-pink-600/30 border border-white/10 text-xs text-gray-300 hover:text-white transition-all text-left"
              >
                🎬 <span className="font-bold text-white">Creator Demo</span>
              </button>
            </div>
          </div>

        </div>

        {/* RIGHT SIDE: Character Artwork Showcase */}
        <div className="hidden md:flex relative bg-gradient-to-br from-purple-950 via-slate-900 to-slate-950 flex-col items-center justify-between p-8 border-l border-white/10 overflow-hidden">
          
          {/* Background Glow Orbs */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-purple-600/30 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-10 right-10 w-60 h-60 bg-pink-500/20 rounded-full blur-2xl pointer-events-none" />

          {/* Top Tagline */}
          <div className="z-10 text-center mt-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold text-yellow-300 shadow-xl mb-2">
              <Popcorn className="w-4 h-4 text-yellow-400" />
              Popcorn & Chill Ready
            </div>
            <h3 className="text-xl font-extrabold text-white tracking-wide">
              Your Ultimate Streaming Lounge
            </h3>
          </div>

          {/* User Provided Character Image */}
          <div className="z-10 my-auto relative group">
            <img
              src={popcornGirlImage}
              alt="FLIXIT Popcorn Girl Character"
              className="max-h-72 object-contain filter drop-shadow-[0_20px_30px_rgba(121,40,202,0.4)] animate-float"
            />
          </div>

          {/* Bottom Card */}
          <div className="z-10 w-full glass-panel p-3 border-white/10 text-center">
            <p className="text-[11px] text-gray-300 font-medium">
              Enjoy 1080p HLS adaptive streaming, synchronized watch party rooms with live chat, and instant creator monetization.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}
