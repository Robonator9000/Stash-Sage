import { useState } from 'react';
import { Profile } from '../types';
import { t } from '../utils/translations';

interface EditProfileModalProps {
  profile: Profile;
  isDark: boolean;
  lang: string;
  onSave: (profile: Profile) => void;
  onClose: () => void;
}

export function EditProfileModal({ profile, isDark, lang, onSave, onClose }: EditProfileModalProps) {
  const [username, setUsername] = useState(profile.username);
  const [bio, setBio] = useState(profile.bio || '');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className={`absolute inset-0 ${isDark ? 'bg-black/60' : 'bg-black/30'}`} />
      <div
        className={`relative w-full max-w-sm rounded-2xl p-6 ${isDark ? 'bg-surface border border-edge' : 'bg-white border border-gray-200'}`}
        onClick={e => e.stopPropagation()}
      >
        <h3 className={`text-lg font-display font-bold mb-4 ${isDark ? 'text-frost' : 'text-gray-800'}`}>{t('editProfile', lang)}</h3>

        <div className="space-y-3">
          <div>
            <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-mist' : 'text-gray-500'}`}>{t('username', lang)}</label>
            <input
              value={username}
              onChange={e => setUsername(e.target.value)}
              maxLength={24}
              className={`w-full px-3 py-2 rounded-xl text-sm outline-none transition-colors ${
                isDark ? 'bg-midnight text-frost border border-edge focus:border-cyanx/50' : 'bg-gray-50 text-gray-900 border border-gray-200 focus:border-cyan-500'
              }`}
            />
          </div>

          <div>
            <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-mist' : 'text-gray-500'}`}>{t('bio', lang)}</label>
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              maxLength={160}
              rows={3}
              className={`w-full px-3 py-2 rounded-xl text-sm outline-none resize-none transition-colors ${
                isDark ? 'bg-midnight text-frost border border-edge focus:border-cyanx/50' : 'bg-gray-50 text-gray-900 border border-gray-200 focus:border-cyan-500'
              }`}
            />
            <p className={`text-xs mt-1 text-right ${isDark ? 'text-muted' : 'text-gray-400'}`}>{bio.length}/160</p>
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button
            onClick={() => onSave({ username: username.trim() || 'User', bio: bio.trim(), joinedAt: profile.joinedAt || new Date().toISOString() })}
            className="flex-1 px-4 py-2 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-cyanx to-emera hover:from-cyanx-dark hover:to-emera-dark transition-all"
          >
            {t('save', lang)}
          </button>
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              isDark ? 'bg-midnight text-mist hover:text-frost' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {t('cancel', lang)}
          </button>
        </div>
      </div>
    </div>
  );
}
