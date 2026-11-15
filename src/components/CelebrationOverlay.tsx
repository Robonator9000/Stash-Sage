interface CelebrationOverlayProps {
  smoke: boolean;
  dollar: boolean;
}

/**
 * Full-screen, pointer-events-none celebration animation (smoke puffs on
 * consume, floating dollars on sale). Extracted from App.tsx verbatim.
 */
export function CelebrationOverlay({ smoke, dollar }: CelebrationOverlayProps) {
  return (
    <>
      {smoke && (
        <div className="fixed inset-0 z-[100] pointer-events-none flex flex-col items-center justify-center gap-2">
          <div className="flex items-end gap-3">
            <span className="animate-smoke-puff text-6xl" style={{ animationDuration: '1.6s', animationDelay: '0s' }}>{'\uD83D\uDD25'}</span>
            <span className="animate-smoke-puff text-7xl" style={{ animationDuration: '1.1s', animationDelay: '0.2s' }}>{'\uD83D\uDCA8'}</span>
            <span className="animate-smoke-puff text-5xl" style={{ animationDuration: '1.4s', animationDelay: '0.4s' }}>{'\uD83D\uDCA8'}</span>
          </div>
          <div className="flex items-end gap-4 mt-2">
            <span className="animate-smoke-puff text-4xl" style={{ animationDuration: '1.3s', animationDelay: '0.1s' }}>{'\uD83D\uDCA8'}</span>
            <span className="animate-smoke-puff text-5xl" style={{ animationDuration: '0.9s', animationDelay: '0.35s' }}>{'\uD83D\uDD25'}</span>
            <span className="animate-smoke-puff text-3xl" style={{ animationDuration: '1.5s', animationDelay: '0.5s' }}>{'\uD83D\uDCA8'}</span>
          </div>
        </div>
      )}
      {dollar && (
        <div className="fixed inset-0 z-[100] pointer-events-none flex flex-col items-center justify-center gap-1">
          <div className="flex items-end gap-3">
            <span className="animate-dollar-float text-4xl" style={{ animationDuration: '1.8s', animationDelay: '0s' }}>{'\uD83D\uDCB0'}</span>
            <span className="animate-dollar-float text-6xl font-black text-emerald-400" style={{ animationDuration: '1.2s', animationDelay: '0.15s' }}>$</span>
            <span className="animate-dollar-float text-4xl" style={{ animationDuration: '1.6s', animationDelay: '0.3s' }}>{'\uD83D\uDCB8'}</span>
          </div>
          <div className="flex items-end gap-4 mt-1">
            <span className="animate-dollar-float text-3xl font-bold text-emerald-400" style={{ animationDuration: '1.4s', animationDelay: '0.1s' }}>$</span>
            <span className="animate-dollar-float text-5xl font-black text-emerald-400" style={{ animationDuration: '2s', animationDelay: '0.35s' }}>$</span>
            <span className="animate-dollar-float text-3xl" style={{ animationDuration: '1.3s', animationDelay: '0.05s' }}>{'\uD83D\uDCB0'}</span>
          </div>
        </div>
      )}
    </>
  );
}