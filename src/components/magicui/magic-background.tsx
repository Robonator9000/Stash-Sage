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
    // Mantine keeps closed modal/drawer roots mounted in the DOM (display:none),
    // so a plain querySelector would pause the particles forever after the
    // first modal open. Check actual visibility instead.
    const isOverlayBlocking = () => {
      const nodes = document.querySelectorAll<HTMLElement>(
        '.mantine-Modal-root, .mantine-Drawer-root, [data-mantine-modal]'
      );
      for (const node of nodes) {
        const style = window.getComputedStyle(node);
        if (style.display !== 'none' && style.visibility !== 'hidden') return true;
      }
      return false;
    };
    const check = () => setPaused(document.hidden || isOverlayBlocking());
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class'] });
    document.addEventListener('visibilitychange', check);
    // Safety net: attributes observer can miss portal swaps; poll cheaply.
    const interval = window.setInterval(check, 750);
    return () => {
      observer.disconnect();
      window.clearInterval(interval);
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
        <Particles quantity={isDark ? 120 : 70} colors={baseColors} className="opacity-100" />
      )}

    </div>
  );
}

export default MagicBackground;