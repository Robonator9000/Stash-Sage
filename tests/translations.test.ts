import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { t } from '../src/utils/translations';

describe('t()', () => {
  beforeEach(() => {
    // Silence the dev-only missing-key warning so test output stays clean.
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('interpolates params into placeholders', () => {
    expect(t('itemsSelected', 'en', { count: 5 })).toBe('5 selected');
  });

  it('leaves placeholders untouched when no params are passed', () => {
    expect(t('itemsSelected', 'en')).toBe('{count} selected');
  });

  it('returns the key itself for unknown keys', () => {
    expect(t('definitely_missing_key_xyz', 'en')).toBe('definitely_missing_key_xyz');
  });

  it('falls back to English for unknown languages', () => {
    expect(t('settings', 'zz')).toBe('Settings');
  });
});