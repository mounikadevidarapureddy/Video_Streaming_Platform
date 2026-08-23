import React, { useState } from 'react';
import { User, Edit3, Save, CheckCircle2, Crown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import AvatarPicker from '../components/AvatarPicker';

export default function UserProfileSettingsView() {
  const { user, updateUserProfile } = useAuth();
  const [username, setUsername] = useState(user?.username || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [refundResult, setRefundResult] = useState(null);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    try {
      const res = await api.updateProfile({ username, bio, avatar_url: avatarUrl });
      updateUserProfile(res.user);
      setMsg('Channel profile updated successfully!');
    } catch (err) {
      alert('Update failed: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!window.confirm('Are you sure you want to cancel your subscription mid-cycle? An automated prorated refund will be issued.')) return;
    try {
      const res = await api.cancelSubscription();
      setRefundResult(res);
      updateUserProfile({ subscription_tier: 'free' });
    } catch (e) {
      alert('Cancellation failed: ' + e.message);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8 animate-fadeIn">
      <div>
        <div className="flex items-center gap-2 text-purple-400 font-bold text-xs uppercase tracking-wider mb-1">
          <User className="w-4 h-4" /> Account & Studio Settings
        </div>
        <h1 className="text-3xl font-black text-white">Channel Profile & Subscriptions</h1>
      </div>

      {msg && (
        <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          {msg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 glass-panel p-6 border border-white/10 space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-purple-400" /> Channel Customization
          </h2>

          <form onSubmit={handleProfileSave} className="space-y-4 text-xs">
            <div>
              <label className="block text-gray-300 font-semibold mb-1">Channel Name</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-purple-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-gray-300 font-semibold mb-1">Channel Bio / Description</label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-purple-500 focus:outline-none"
              />
            </div>

            {/* Avatar Selection Grid */}
            <AvatarPicker
              selectedAvatar={avatarUrl}
              onSelectAvatar={(url) => setAvatarUrl(url)}
            />

            <button
              type="submit"
              disabled={saving}
              className="glow-btn-purple px-6 py-3 font-bold text-xs flex items-center gap-2"
            >
              <Save className="w-4 h-4" /> Save Profile Changes
            </button>
          </form>
        </div>

        <div className="glass-panel p-6 border border-white/10 flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-gray-400 font-bold uppercase">Membership Tier</span>
              <Crown className="w-5 h-5 text-yellow-400 fill-yellow-400" />
            </div>

            <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-500/30 text-center mb-4">
              <span className="text-2xl font-black text-white uppercase">{user?.subscription_tier} TIER</span>
              <span className="block text-[10px] text-purple-300 mt-1">Stripe Billing Active</span>
            </div>

            <p className="text-xs text-gray-400 leading-relaxed">
              Subscribers enjoy ad-free 1080p HLS adaptive streaming, watch party hosting, and creator tips.
            </p>
          </div>

          {user?.subscription_tier !== 'free' && (
            <button
              onClick={handleCancelSubscription}
              className="w-full py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 text-xs font-bold transition-all"
            >
              Cancel Subscription (Prorated Refund)
            </button>
          )}

          {refundResult && (
            <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-500/30 text-[11px] text-emerald-300 space-y-1">
              <span className="font-bold block">Refund Processed:</span>
              <p>{refundResult.details}</p>
              <span className="font-black text-emerald-400 text-xs block">${refundResult.prorated_refund}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
