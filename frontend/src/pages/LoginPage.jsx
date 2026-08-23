import React, { useState } from 'react';
import { Mail, Lock, Sparkles, LogIn, ArrowLeft, Popcorn, Play } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import popcornGirlImage from '../assets/popcorn_girl.png';

export default function LoginPage({ onNavigateRegister, onNavigateForgotPassword, onBackToBrowse }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login({ email, password });
      onBackToBrowse();
    } catch (err) {
      setError(err.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail, demoPass) => {
    setError('');
    setLoading(true);
    try {
      await login({ email: demoEmail, password: demoPass });
      onBackToBrowse();
    } catch (err) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090e] text-white flex items-center justify-center p-4 md:p-8 relative overflow-hidden">
      <div className="absolute top-10 left-10 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl pointer-events-none" />

      <button
        onClick={onBackToBrowse}
        className="absolute top-6 left-6 z-20 flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-gray-300 hover:text-white transition-all backdrop-blur-md"
      >
        <ArrowLeft className="w-4 h-4" /> Back to FLIXIT Streams
      </button>

      <div className="relative w-full max-w-5xl glass-panel border border-white/10 rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2 z-10">
        <div className="p-8 md:p-12 flex flex-col justify-between">
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
              Welcome Back
            </span>

            <h1 className="text-3xl font-black text-white mb-2">Sign In to Your Account</h1>
            <p className="text-xs text-gray-400 mb-6">Access your personalized 4K streams, watch party rooms, and creator dashboard.</p>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
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
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-gray-300">Password</label>
                  <button
                    type="button"
                    onClick={onNavigateForgotPassword}
                    className="text-[11px] text-purple-400 hover:underline font-semibold"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full glow-btn-purple py-3.5 text-sm flex items-center justify-center gap-2 font-bold mt-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <LogIn className="w-4 h-4" /> Sign In Now
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="mt-8 pt-4 border-t border-white/10 space-y-4">
            <p className="text-xs text-gray-400 text-center">
              Don't have a FLIXIT account?{' '}
              <button
                onClick={onNavigateRegister}
                className="text-purple-400 font-bold hover:underline"
              >
                Create Account Free
              </button>
            </p>

            <div>
              <span className="text-[10px] font-bold uppercase text-gray-500 tracking-wider block mb-2 text-center">
                Quick Demo One-Click Sign In:
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleDemoLogin('admin@flixit.com', 'password')}
                  className="px-3 py-2 rounded-xl bg-white/5 hover:bg-purple-600/30 border border-white/10 text-xs text-gray-300 hover:text-white transition-all font-semibold"
                >
                  👑 Admin / VIP Demo
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoLogin('jane@flixit.com', 'password')}
                  className="px-3 py-2 rounded-xl bg-white/5 hover:bg-pink-600/30 border border-white/10 text-xs text-gray-300 hover:text-white transition-all font-semibold"
                >
                  🎬 Creator Studio Demo
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="hidden md:flex relative bg-gradient-to-br from-purple-950 via-slate-900 to-slate-950 flex-col items-center justify-between p-10 border-l border-white/10 overflow-hidden">
          <div className="z-10 text-center mt-2">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold text-yellow-300 shadow-xl mb-2">
              <Popcorn className="w-4 h-4 text-yellow-400" />
              Popcorn & Chill
            </div>
            <h2 className="text-2xl font-black text-white">Your Premium Movie Lounge</h2>
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
              Stream 1080p HLS adaptive videos, create watch party rooms with friends, and enjoy ad-free content.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
