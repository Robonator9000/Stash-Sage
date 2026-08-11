import type { MantineColorScheme, MantineColorSchemeManager } from '@mantine/core';

function currentScheme(): MantineColorScheme {
  const dark = document.documentElement.classList.contains('dark');
  return dark ? 'dark' : 'light';
}

const callbacks = new Set<(colorScheme: MantineColorScheme) => void>();

let observer: MutationObserver | null = null;

function ensureObserver() {
  if (observer) return;
  observer = new MutationObserver(() => {
    const scheme = currentScheme();
    for (const cb of callbacks) cb(scheme);
  });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
}

/** Syncs Mantine's internal color scheme with the app's `.dark` class,
 *  which App.tsx toggles based on the settings.theme value. */
export const classColorSchemeManager: MantineColorSchemeManager = {
  get: () => currentScheme(),
  set: (value) => {
    const root = document.documentElement;
    if (value === 'dark' || (value === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  },
  subscribe: (onUpdate) => {
    callbacks.add(onUpdate);
    ensureObserver();
  },
  unsubscribe: () => {
    callbacks.clear();
    observer?.disconnect();
    observer = null;
  },
  clear: () => {
    document.documentElement.classList.remove('dark');
  },
};