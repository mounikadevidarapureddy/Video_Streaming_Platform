import React, { useState } from 'react';
import { User, Mail, Lock, Sparkles, UserPlus, ArrowLeft, Popcorn, Play } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AvatarPicker from '../components/AvatarPicker';
import popcornGirlImage from '../assets/popcorn_girl.png';

export default function RegisterPage({ onNavigateLogin, onBackToBrowse }) {
  const { register } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('https://api.dicebear.com/7.x/bottts/svg?seed=CyberGirl');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register({ username, email, password, avatar_url: selectedAvatar });
      onBackToBrowse();
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090e] text-white flex items-center justify-center p-4 md:p-8 relative overflow-hidden">
      <div className="absolute top-10 right-10 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl pointer-events-none" />

      <button
        onClick={onBackToBrowse}
        className="absolute top-6 left-6 z-20 flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-gray-300 hover:text-white transition-all backdrop-blur-md"
      >
        <ArrowLeft className="w-4 h-4" /> Back to FLIXIT Streams
      </button>

      <div className="relative w-full max-w-5xl glass-panel border border-white/10 rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2 z-10">
        <div className="p-8 md:p-12 flex flex-col justify-between max-h-[90vh] overflow-y-auto">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-600/40">
                <Play className="w-5 h-5 text-white fill-white ml-0.5" />
              </div>
              <span className="font-extrabold text-xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                FLIXIT
              </span>
            </div>

            <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30 inline-flex items-center gap-1.5 mb-3">
              <Sparkles className="w-3 h-3 text-purple-400" />
              Create Free Account
            </span>

            <h1 className="text-3xl font-black text-white mb-2">Join FLIXIT Streaming</h1>
            <p className="text-xs text-gray-400 mb-6">Create your channel, host watch parties & upload HLS videos.</p>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Channel Username</label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. CinemaMaster"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="you@domain.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* 15 Avatar Selector */}
              <AvatarPicker
                selectedAvatar={selectedAvatar}
                onSelectAvatar={(url) => setSelectedAvatar(url)}
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full glow-btn-purple py-3.5 text-sm flex items-center justify-center gap-2 font-bold mt-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" /> Create Account Now
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="mt-8 pt-4 border-t border-white/10 text-center">
            <p className="text-xs text-gray-400">
              Already have a FLIXIT account?{' '}
              <button
                onClick={onNavigateLogin}
                className="text-purple-400 font-bold hover:underline"
              >
                Sign In Here
              </button>
            </p>
          </div>
        </div>

        <div className="hidden md:flex relative bg-gradient-to-br from-purple-950 via-slate-900 to-slate-950 flex-col items-center justify-between p-10 border-l border-white/10 overflow-hidden">
          <div className="z-10 text-center mt-2">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold text-yellow-300 shadow-xl mb-2">
              <Popcorn className="w-4 h-4 text-yellow-400" />
              Popcorn Ready
            </div>
            <h2 className="text-2xl font-black text-white">Join the Community</h2>
          </div>

          <div className="z-10 my-auto relative">
            <img
              src={popcornGirlImage}
              alt="FLIXIT Popcorn Girl Character"
              className="max-h-80 object-contain filter drop-shadow-[0_20px_30px_rgba(121,40,202,0.4)] animate-float"
            />
          </div>

          <div className="z-10 w-full glass-panel p-4 border-white/10 text-center">
            <p className="text-xs text-gray-300 font-semibold">
              Host synchronized watch party rooms with live chat, enjoy ad-free 4K HLS streaming, and tip creators!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
