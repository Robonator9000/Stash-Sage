import { useState, useEffect, useCallback } from 'react';
import { Settings } from '../types';
import { safeSetItem } from './helpers';
import { supabase } from './supabase';
import { useAuth } from '../contexts/AuthContext';
import { showToast } from '../components/Toast';

const SETTINGS_KEY = 'weed-settings';
const SETTINGS_VERSION = 1;

const defaultSettings: Settings = {
  language: 'en', theme: 'dark', themeAuto: true, onboardingDone: false,
  coachMarksDone: false, currency: '$', decimalPrecision: 2,
  showTimerMs: false, pinEnabled: false, pinHash: '',
  statsVisibility: {
    totalProducts: true, totalAmount: true, totalSessions: true,
    averageRating: true, averageTHC: true, totalValue: true,
    pricePerGram: true, lastConsumed: true, consumptionRate: true,
    projectedRunOut: true,
  },
  favoriteBrands: [], recentBrands: [],
  sessionDefaults: {
    defaultAmount: 0.5, defaultPeople: 2, defaultHitTimer: 10,
    defaultGramsPerBowl: 0.25, rotationEnabled: true,
  },
  lowStockThreshold: 0, budgetLimit: 0, budgetPeriod: 'monthly',
  settingsVersion: SETTINGS_VERSION, customStrainColors: {},
  notificationsSound: true, notificationsEnabled: true,
  defaultFeedFilter: 'latest', showOnlineStatus: true,
};

function loadSettings(): Settings {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (!saved) return { ...defaultSettings };
    const parsed = JSON.parse(saved);
    const merged = {
      ...defaultSettings,
      ...parsed,
      sessionDefaults: { ...defaultSettings.sessionDefaults, ...parsed.sessionDefaults },
      statsVisibility: { ...defaultSettings.statsVisibility, ...parsed.statsVisibility },
    };
    if (!parsed.settingsVersion || parsed.settingsVersion < SETTINGS_VERSION) {
      merged.budgetLimit = 0;
      merged.lowStockThreshold = 0;
      merged.settingsVersion = SETTINGS_VERSION;
    }
    return merged;
  } catch {
    return { ...defaultSettings };
  }
}

type Listener = (s: Settings) => void;
let _settings: Settings = loadSettings();
const _listeners = new Set<Listener>();
let _persistUser: string | undefined;
let _persistTimer: ReturnType<typeof setTimeout> | undefined;

function notifyListeners() {
  _listeners.forEach((l) => l(_settings));
}

function persistSettings(s: Settings, user: string | undefined) {
  _persistUser = user;
  _settings = s;
  safeSetItem(SETTINGS_KEY, JSON.stringify(s));
  if (_persistTimer) clearTimeout(_persistTimer);
  _persistTimer = setTimeout(() => {
    if (_persistUser) {
      supabase.from('settings').upsert(
        { user_id: _persistUser, data: _settings },
        { onConflict: 'user_id' }
      ).then(undefined, (err) => showToast({ id: 'sync-failed', title: 'Sync error', body: err?.message || 'Could not save to cloud' }));
    }
  }, 400);
}

export function useSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<Settings>(() => ({ ..._settings }));

  useEffect(() => {
    _listeners.add(setSettings);
    return () => {
      _listeners.delete(setSettings);
      if (_listeners.size === 0 && _persistTimer) {
        clearTimeout(_persistTimer);
        _persistTimer = undefined;
      }
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    supabase.from('settings').select('data').eq('user_id', user.id).maybeSingle()
      .then(({ data }) => {
        if (!data?.data && user) {
          supabase.from('settings').upsert(
            { user_id: user.id, data: _settings },
            { onConflict: 'user_id' }
          ).then(undefined, (err) => showToast({ id: 'sync-failed', title: 'Sync error', body: err?.message || 'Could not save to cloud' }));
          return;
        }
        if (data?.data) {
          const parsed = data.data as Settings;
          const merged = {
            ...defaultSettings,
            ...parsed,
            sessionDefaults: { ...defaultSettings.sessionDefaults, ...parsed.sessionDefaults },
            statsVisibility: { ...defaultSettings.statsVisibility, ...parsed.statsVisibility },
          };
          if (_settings.onboardingDone) merged.onboardingDone = true;
          // Preserve the locally chosen theme/auto-theme to avoid mid-session theme jumps
          // when cloud state arrives after a manual toggle or a page switch.
          if (_settings.onboardingDone) {
            merged.theme = _settings.theme;
            merged.themeAuto = _settings.themeAuto;
          }
          _settings = { ...merged };
          notifyListeners();
          safeSetItem(SETTINGS_KEY, JSON.stringify(_settings));
        }
      });
  }, [user?.id]);

  const syncSettings = useCallback((s: Settings) => {
    persistSettings(s, user?.id);
    notifyListeners();
  }, [user?.id]);

  const updateSettings = useCallback((updates: Partial<Settings>) => {
    const next = { ..._settings, ...updates };
    syncSettings(next);
  }, [syncSettings]);

  const replaceSettings = useCallback((nextSettings: Settings) => {
    const merged = { ...defaultSettings, ...nextSettings };
    syncSettings(merged);
  }, [syncSettings]);

  const toggleStatVisibility = useCallback((stat: keyof Settings['statsVisibility']) => {
    const next = {
      ..._settings,
      statsVisibility: {
        ..._settings.statsVisibility,
        [stat]: !_settings.statsVisibility[stat],
      },
    };
    syncSettings(next);
  }, [syncSettings]);

  const addFavoriteBrand = useCallback((brand: string) => {
    const next = {
      ..._settings,
      favoriteBrands: _settings.favoriteBrands.includes(brand)
        ? _settings.favoriteBrands
        : [..._settings.favoriteBrands, brand],
    };
    syncSettings(next);
  }, [syncSettings]);

  const removeFavoriteBrand = useCallback((brand: string) => {
    const next = {
      ..._settings,
      favoriteBrands: _settings.favoriteBrands.filter((b) => b !== brand),
    };
    syncSettings(next);
  }, [syncSettings]);

  const addRecentBrand = useCallback((brand: string) => {
    const next = {
      ..._settings,
      recentBrands: [brand, ..._settings.recentBrands.filter((b) => b !== brand)].slice(0, 10),
    };
    syncSettings(next);
  }, [syncSettings]);

  return {
    settings, updateSettings, replaceSettings, toggleStatVisibility,
    addFavoriteBrand, removeFavoriteBrand, addRecentBrand,
  };
}
