import React from 'react';
import { Check, Image as ImageIcon } from 'lucide-react';

export default function AvatarPicker({ selectedAvatar, onSelectAvatar }) {
  // 15 Curated High-Res Avatars
  const presetAvatars = [
    'https://api.dicebear.com/7.x/bottts/svg?seed=CyberGirl',
    'https://api.dicebear.com/7.x/bottts/svg?seed=NeonKnight',
    'https://api.dicebear.com/7.x/bottts/svg?seed=CinemaMaster',
    'https://api.dicebear.com/7.x/bottts/svg?seed=Starlight',
    'https://api.dicebear.com/7.x/bottts/svg?seed=AnimeVibes',
    'https://api.dicebear.com/7.x/bottts/svg?seed=GamingPro',
    'https://api.dicebear.com/7.x/bottts/svg?seed=RetroPulse',
    'https://api.dicebear.com/7.x/bottts/svg?seed=SpaceRanger',
    'https://api.dicebear.com/7.x/bottts/svg?seed=Vanguard',
    'https://api.dicebear.com/7.x/bottts/svg?seed=ShadowNinja',
    'https://api.dicebear.com/7.x/bottts/svg?seed=PixelHero',
    'https://api.dicebear.com/7.x/bottts/svg?seed=CosmicWave',
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
    'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&q=80'
  ];

  return (
    <div className="space-y-3">
      <label className="block text-xs font-semibold text-gray-300">
        Choose Your Profile Avatar (Select from 15 Presets or Enter Image URL):
      </label>

      {/* Grid of 15 Avatars */}
      <div className="grid grid-cols-5 gap-2.5 p-2 rounded-2xl bg-white/5 border border-white/10 max-h-48 overflow-y-auto">
        {presetAvatars.map((url, idx) => {
          const isSelected = selectedAvatar === url;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => onSelectAvatar(url)}
              className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all p-1 group flex items-center justify-center ${
                isSelected
                  ? 'border-purple-500 bg-purple-500/20 scale-105 shadow-lg shadow-purple-500/40'
                  : 'border-white/10 bg-slate-900/60 hover:border-white/30 hover:scale-105'
              }`}
            >
              <img src={url} alt={`Avatar ${idx + 1}`} className="w-full h-full object-cover rounded-lg" />
              {isSelected && (
                <div className="absolute inset-0 bg-purple-600/40 backdrop-blur-[2px] flex items-center justify-center">
                  <Check className="w-5 h-5 text-white font-bold" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Custom Avatar URL Field */}
      <div className="relative">
        <ImageIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Or paste custom image URL (https://...)"
          value={selectedAvatar}
          onChange={(e) => onSelectAvatar(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
        />
      </div>
    </div>
  );
}
