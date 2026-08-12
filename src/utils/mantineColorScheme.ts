import type { MantineColorScheme, MantineColorSchemeManager } from '@mantine/core';

function currentScheme(): MantineColorScheme {
  const dark = document.documentElement.classList.contains('dark');
  return dark ? 'dark' : 'light';
}

function applyScheme(value: MantineColorScheme) {
  const root = document.documentElement;
  const isDark =
    value === 'dark' || (value === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  root.classList.toggle('dark', isDark);
  root.setAttribute('data-mantine-color-scheme', isDark ? 'dark' : 'light');
}

/** Keeps Mantine's color scheme in sync with the `.dark` class that App.tsx
 *  toggles based on settings.theme. No MutationObserver is used here: the
 *  class and the data-mantine-color-scheme attribute are set together in
 *  App.tsx's theme effect, so Mantine never writes the class back. */
export const classColorSchemeManager: MantineColorSchemeManager = {
  get: () => currentScheme(),
  set: (value) => {
    applyScheme(value);
  },
  subscribe: () => () => {},
  unsubscribe: () => {},
  clear: () => {
    applyScheme('light');
  },
};
