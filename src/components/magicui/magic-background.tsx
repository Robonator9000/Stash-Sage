import { useEffect, useState } from 'react';
import { InteractiveGridBackground } from './grid-pattern';
import { Particles } from './particles';

interface MagicBackgroundProps {
  isDark: boolean;
  variant?: 'full' | 'grid-only';
}

/** Full-screen magicui background: interactive colourful grid + drifting particles.
 *  Pauses automatically when a Mantine modal/drawer is open (perf).
 */
export function MagicBackground({ isDark, variant = 'full' }: MagicBackgroundProps) {
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const check = () => {
      const blocked =
        document.hidden ||
        !!document.querySelector('.mantine-Modal-root, .mantine-Drawer-root, [data-mantine-modal]');
      setPaused(blocked);
    };
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.body, { childList: true, subtree: true });
    document.addEventListener('visibilitychange', check);
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', check);
    };
  }, []);

  const baseColors = isDark
    ? ['#06b6d4', '#10b981', '#13eeef', '#06b6d4']
    : ['#0891b2', '#059669', '#13eeef', '#0891b2'];

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0">
      <InteractiveGridBackground colors={baseColors} baseOpacity={isDark ? 0.14 : 0.1} />
      {!paused && variant === 'full' && (
        <Particles quantity={isDark ? 55 : 35} colors={baseColors} className="opacity-70" />
      )}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(to bottom, transparent 40%, ${
            isDark ? 'rgba(11,17,32,0.55)' : 'rgba(242,244,248,0.55)'
          })`,
        }}
      />
    </div>
  );
}

export default MagicBackground;