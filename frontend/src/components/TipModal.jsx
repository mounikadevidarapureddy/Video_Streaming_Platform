import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { X, HeartHandshake, DollarSign, Sparkles } from 'lucide-react';
import { api } from '../services/api';

export default function TipModal({ video, isOpen, onClose }) {
  const [amount, setAmount] = useState('5.00');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !video) return null;

  const handleSendTip = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.tipCreator({
        creator_id: video.user_id,
        amount: parseFloat(amount),
        message
      });

      // Fire victory confetti burst
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      });

      alert(res.message);
      onClose();
    } catch (err) {
      alert('Tipping failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
      <div className="relative glass-panel border border-white/10 max-w-md w-full p-6 rounded-3xl">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white">
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-pink-500/20 border border-pink-500/30 flex items-center justify-center text-pink-400 mx-auto mb-2">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-extrabold text-white">Support Creator</h3>
          <p className="text-xs text-gray-400">Send a direct tip to <span className="text-pink-300 font-bold">{video.username}</span></p>
        </div>

        <form onSubmit={handleSendTip} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Tip Amount ($ USD)</label>
            <div className="grid grid-cols-4 gap-2 mb-2">
              {['2.00', '5.00', '10.00', '25.00'].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setAmount(val)}
                  className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                    amount === val ? 'bg-pink-600 text-white border-pink-400' : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10'
                  }`}
                >
                  ${val}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Custom Note / Support Message</label>
            <input
              type="text"
              placeholder="Love your video content!"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:border-pink-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full glow-btn-purple py-3 text-xs font-bold flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-yellow-300" />
            {loading ? 'Processing Tip...' : `Send $${amount} Direct Tip`}
          </button>
        </form>
      </div>
    </div>
  );
}
