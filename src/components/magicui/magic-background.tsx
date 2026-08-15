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
    // Mantine keeps closed modal/drawer roots mounted in the DOM as empty
    // shells (display:block but zero height, no overlay/content), so neither
    // querySelector nor getComputedStyle alone can tell open from closed.
    // An OPEN root always lays out its overlay+content, so require actual
    // rendered size + a visible overlay/content child to count as blocking.
    const isOverlayBlocking = () => {
      const nodes = document.querySelectorAll<HTMLElement>(
        '.mantine-Modal-root, .mantine-Drawer-root, [data-mantine-modal]'
      );
      for (const node of nodes) {
        const style = window.getComputedStyle(node);
        if (style.display === 'none' || style.visibility === 'hidden') continue;
        // Closed shells have no layout; open overlays fill the viewport.
        if (node.offsetHeight === 0 && node.offsetWidth === 0) continue;
        if (node.querySelector('.mantine-Modal-overlay, .mantine-Drawer-overlay, .mantine-Modal-content, .mantine-Drawer-content')) {
          return true;
        }
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