import { useState, useEffect, useCallback } from 'react';
import { Settings } from '../types';
import { safeSetItem } from './helpers';

const SETTINGS_KEY = 'weed-settings';

const defaultSettings: Settings = {
  language: 'en',
  theme: 'dark',
  onboardingDone: false,
  currency: '$',
  decimalPrecision: 2,
  showTimerMs: false,
  pinEnabled: false,
  pinHash: '',
  statsVisibility: {
    totalProducts: true,
    totalAmount: true,
    totalSessions: true,
    averageRating: true,
    averageTHC: true,
    totalValue: true,
    lastConsumed: true,
  },
  favoriteBrands: [],
  recentBrands: [],
  sessionDefaults: {
    defaultAmount: 0.5,
    defaultPeople: 2,
    defaultHitTimer: 10,
    defaultGramsPerBowl: 0.25,
    rotationEnabled: false,
  },
};

function loadSettings(): Settings {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (!saved) return { ...defaultSettings };
    const parsed = JSON.parse(saved);
    return {
      ...defaultSettings,
      ...parsed,
      sessionDefaults: { ...defaultSettings.sessionDefaults, ...parsed.sessionDefaults },
    };
  } catch {
    return { ...defaultSettings };
  }
}

type Listener = (s: Settings) => void;
let _settings: Settings = loadSettings();
const _listeners = new Set<Listener>();

function notifyListeners() {
  _listeners.forEach((l) => l(_settings));
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(() => ({ ..._settings }));

  useEffect(() => {
    _listeners.add(setSettings);
    return () => { _listeners.delete(setSettings); };
  }, []);

  const updateSettings = useCallback((updates: Partial<Settings>) => {
    _settings = { ..._settings, ...updates };
    safeSetItem(SETTINGS_KEY, JSON.stringify(_settings));
    notifyListeners();
  }, []);

  const toggleStatVisibility = useCallback((stat: keyof Settings['statsVisibility']) => {
    _settings = {
      ..._settings,
      statsVisibility: {
        ..._settings.statsVisibility,
        [stat]: !_settings.statsVisibility[stat],
      },
    };
    safeSetItem(SETTINGS_KEY, JSON.stringify(_settings));
    notifyListeners();
  }, []);

  const addFavoriteBrand = useCallback((brand: string) => {
    _settings = {
      ..._settings,
      favoriteBrands: _settings.favoriteBrands.includes(brand)
        ? _settings.favoriteBrands
        : [..._settings.favoriteBrands, brand],
    };
    safeSetItem(SETTINGS_KEY, JSON.stringify(_settings));
    notifyListeners();
  }, []);

  const removeFavoriteBrand = useCallback((brand: string) => {
    _settings = {
      ..._settings,
      favoriteBrands: _settings.favoriteBrands.filter((b) => b !== brand),
    };
    safeSetItem(SETTINGS_KEY, JSON.stringify(_settings));
    notifyListeners();
  }, []);

  const addRecentBrand = useCallback((brand: string) => {
    _settings = {
      ..._settings,
      recentBrands: [brand, ..._settings.recentBrands.filter((b) => b !== brand)].slice(0, 10),
    };
    safeSetItem(SETTINGS_KEY, JSON.stringify(_settings));
    notifyListeners();
  }, []);

  const replaceSettings = useCallback((nextSettings: Settings) => {
    _settings = { ...defaultSettings, ...nextSettings };
    safeSetItem(SETTINGS_KEY, JSON.stringify(_settings));
    notifyListeners();
  }, []);

  return {
    settings,
    updateSettings,
    replaceSettings,
    toggleStatVisibility,
    addFavoriteBrand,
    removeFavoriteBrand,
    addRecentBrand,
  };
}
