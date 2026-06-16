import { useState } from 'react';
import { Product, Session, Profile } from '../types';
import { t } from '../utils/translations';
import { LogoIcon } from './LogoIcon';

interface ProfileCardProps {
  profile?: Profile;
  products: Product[];
  sessions: Session[];
  isDark: boolean;
  lang: string;
  onEditProfile: () => void;
  onUpdateProfile: (p: Profile) => void;
}

export function ProfileCard({ profile, products, sessions, isDark, lang, onEditProfile, onUpdateProfile }: ProfileCardProps) {
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState(profile?.username || '');
  const [bio, setBio] = useState(profile?.bio || '');

  if (!profile) {
    return (
      <div className={`max-w-lg mx-auto p-6 rounded-2xl text-center ${isDark ? 'bg-surface/50 border border-edge' : 'bg-white border border-gray-200'}`}>
        <LogoIcon className="w-16 h-16 mx-auto mb-4 opacity-40" />
        <p className={`text-sm mb-4 ${isDark ? 'text-mist' : 'text-gray-500'}`}>{t('profileNotSet', lang)}</p>
        <button
          onClick={() => setEditing(true)}
          className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-cyanx to-emera hover:from-cyanx-dark hover:to-emera-dark transition-all"
        >
          {t('createProfile', lang)}
        </button>

        {editing && (
          <div className="mt-4 text-left space-y-3">
            <input
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder={t('username', lang)}
              maxLength={24}
              className={`w-full px-3 py-2 rounded-xl text-sm outline-none transition-colors ${
                isDark ? 'bg-midnight text-frost border border-edge focus:border-cyanx/50' : 'bg-gray-50 text-gray-900 border border-gray-200 focus:border-cyan-500'
              }`}
            />
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder={t('bio', lang)}
              maxLength={160}
              rows={3}
              className={`w-full px-3 py-2 rounded-xl text-sm outline-none resize-none transition-colors ${
                isDark ? 'bg-midnight text-frost border border-edge focus:border-cyanx/50' : 'bg-gray-50 text-gray-900 border border-gray-200 focus:border-cyan-500'
              }`}
            />
            <div className="flex gap-2">
              <button
                onClick={() => { onUpdateProfile({ username: username.trim() || 'User', bio: bio.trim(), joinedAt: new Date().toISOString() }); setEditing(false); }}
                className="flex-1 px-4 py-2 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-cyanx to-emera hover:from-cyanx-dark hover:to-emera-dark transition-all"
              >
                {t('save', lang)}
              </button>
              <button
                onClick={() => setEditing(false)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  isDark ? 'bg-surface text-mist hover:text-frost' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {t('cancel', lang)}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  const totalProducts = products.length;
  const totalSessions = sessions.length;
  const totalAmount = products.reduce((s, p) => s + p.amount, 0);

  const joinedDate = profile.joinedAt ? new Date(profile.joinedAt).toLocaleDateString(lang, { year: 'numeric', month: 'short' }) : '';

  return (
    <div className={`max-w-lg mx-auto ${isDark ? 'text-frost' : 'text-gray-800'}`}>
      {/* Profile header */}
      <div className={`p-6 rounded-2xl ${isDark ? 'bg-surface/50 border border-edge' : 'bg-white border border-gray-200'}`}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 overflow-hidden ${profile.avatar_url ? '' : 'bg-gradient-to-br from-cyanx to-emera'}`}>
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-white font-display font-bold text-lg">{profile.username[0]?.toUpperCase() || '?'}</span>
              )}
            </div>
            <div>
              <h2 className="font-display font-bold text-lg">{profile.username}</h2>
              {joinedDate && <p className={`text-xs ${isDark ? 'text-muted' : 'text-gray-400'}`}>{t('joined', lang)} {joinedDate}</p>}
            </div>
          </div>
          <button
            onClick={onEditProfile}
            className={`p-2 rounded-xl text-xs font-medium transition-all ${
              isDark ? 'bg-midnight text-mist hover:bg-surface hover:text-frost' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
            </svg>
          </button>
        </div>

        {profile.bio && (
          <p className={`text-sm mb-4 ${isDark ? 'text-mist' : 'text-gray-500'}`}>{profile.bio}</p>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className={`text-center p-3 rounded-xl ${isDark ? 'bg-midnight' : 'bg-gray-50'}`}>
            <p className="text-lg font-display font-bold">{totalProducts}</p>
            <p className={`text-xs ${isDark ? 'text-muted' : 'text-gray-400'}`}>{t('products', lang)}</p>
          </div>
          <div className={`text-center p-3 rounded-xl ${isDark ? 'bg-midnight' : 'bg-gray-50'}`}>
            <p className="text-lg font-display font-bold">{totalAmount.toFixed(1)}<span className="text-xs">g</span></p>
            <p className={`text-xs ${isDark ? 'text-muted' : 'text-gray-400'}`}>{t('totalAmount', lang)}</p>
          </div>
          <div className={`text-center p-3 rounded-xl ${isDark ? 'bg-midnight' : 'bg-gray-50'}`}>
            <p className="text-lg font-display font-bold">{totalSessions}</p>
            <p className={`text-xs ${isDark ? 'text-muted' : 'text-gray-400'}`}>{t('totalSessions', lang)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
