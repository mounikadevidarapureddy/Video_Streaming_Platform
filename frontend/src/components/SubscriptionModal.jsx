import React, { useState } from 'react';
import { X, Check, Crown, Zap, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function SubscriptionModal({ isOpen, onClose }) {
  const { user, updateUserProfile } = useAuth();
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSelectPlan = async (planName) => {
    setLoading(true);
    try {
      const res = await api.subscribe(planName);
      updateUserProfile({ subscription_tier: res.subscription_tier });
      alert(res.message);
      onClose();
    } catch (e) {
      alert('Subscription failed: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
      <div className="relative glass-panel border border-white/10 max-w-3xl w-full p-6 md:p-8 rounded-3xl">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white">
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-8">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase tracking-widest">
            FLIXIT Stripe Subscriptions
          </span>
          <h2 className="text-3xl font-black text-white mt-2">Choose Your Streaming Plan</h2>
          <p className="text-xs text-gray-400 mt-1">Unlock 1080p HLS adaptive streaming, watch parties, and exclusive creator content.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Premium Plan */}
          <div className="glass-panel p-6 border-purple-500/40 relative flex flex-col justify-between hover:scale-105 transition-transform">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="font-extrabold text-lg text-purple-400">PREMIUM</span>
                <Zap className="w-6 h-6 text-purple-400" />
              </div>
              <div className="text-3xl font-black text-white mb-4">$9.99 <span className="text-xs font-semibold text-gray-400">/ month</span></div>
              <ul className="space-y-2.5 text-xs text-gray-300 mb-6">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Ad-Free 1080p HLS Streaming</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Unlimited Watch Party Rooms</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Automatic Mid-Cycle Refund Support</li>
              </ul>
            </div>
            <button
              onClick={() => handleSelectPlan('premium')}
              disabled={loading}
              className="glow-btn-purple w-full py-3 text-xs font-bold"
            >
              {user?.subscription_tier === 'premium' ? 'Current Plan' : 'Subscribe $9.99/mo'}
            </button>
          </div>

          {/* VIP Plan */}
          <div className="glass-panel p-6 border-pink-500/50 bg-gradient-to-b from-purple-950/40 to-slate-900/60 relative flex flex-col justify-between hover:scale-105 transition-transform">
            <span className="absolute -top-3 right-6 px-3 py-0.5 rounded-full text-[9px] font-black uppercase bg-pink-500 text-white shadow-lg shadow-pink-500/50">
              POPULAR
            </span>
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="font-extrabold text-lg text-pink-400 flex items-center gap-1.5">
                  <Crown className="w-5 h-5 text-yellow-400 fill-yellow-400" /> VIP CREATOR
                </span>
              </div>
              <div className="text-3xl font-black text-white mb-4">$19.99 <span className="text-xs font-semibold text-gray-400">/ month</span></div>
              <ul className="space-y-2.5 text-xs text-gray-300 mb-6">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Ultra-High 4K Bitrate Streams</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> All Pay-Per-View Streams Unlocked</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Priority Creator Revenue Share</li>
              </ul>
            </div>
            <button
              onClick={() => handleSelectPlan('vip')}
              disabled={loading}
              className="glow-btn-red w-full py-3 text-xs font-bold"
            >
              {user?.subscription_tier === 'vip' ? 'Current Plan' : 'Subscribe $19.99/mo'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
