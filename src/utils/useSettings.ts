import { useState, useEffect, useCallback } from 'react';
import { Settings } from '../types';

const SETTINGS_KEY = 'weed-settings';

const defaultSettings: Settings = {
  language: 'en',
  theme: 'dark',
  statsVisibility: {
    totalProducts: true,
    totalAmount: true,
    totalSessions: true,
    averageRating: true,
    averageTHC: true,
    totalValue: true,
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

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      if (!saved) return defaultSettings;
      const parsed = JSON.parse(saved);
      return {
        ...defaultSettings,
        ...parsed,
        sessionDefaults: { ...defaultSettings.sessionDefaults, ...parsed.sessionDefaults },
      };
    } catch {
      return defaultSettings;
    }
  });

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  const updateSettings = useCallback((updates: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  }, []);

  const toggleStatVisibility = useCallback((stat: keyof Settings['statsVisibility']) => {
    setSettings((prev) => ({
      ...prev,
      statsVisibility: {
        ...prev.statsVisibility,
        [stat]: !prev.statsVisibility[stat],
      },
    }));
  }, []);

  const addFavoriteBrand = useCallback((brand: string) => {
    setSettings((prev) => ({
      ...prev,
      favoriteBrands: prev.favoriteBrands.includes(brand)
        ? prev.favoriteBrands
        : [...prev.favoriteBrands, brand],
    }));
  }, []);

  const removeFavoriteBrand = useCallback((brand: string) => {
    setSettings((prev) => ({
      ...prev,
      favoriteBrands: prev.favoriteBrands.filter((b) => b !== brand),
    }));
  }, []);

  const addRecentBrand = useCallback((brand: string) => {
    setSettings((prev) => ({
      ...prev,
      recentBrands: [brand, ...prev.recentBrands.filter((b) => b !== brand)].slice(0, 10),
    }));
  }, []);

  const replaceSettings = useCallback((nextSettings: Settings) => {
    setSettings({ ...defaultSettings, ...nextSettings });
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