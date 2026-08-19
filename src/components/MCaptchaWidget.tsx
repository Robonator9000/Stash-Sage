import { useEffect, useRef, useState } from 'react';

interface MCaptchaWidgetProps {
  onVerify: (token: string) => void;
  className?: string;
}

const MCAPTCHA_WIDGET_URL = 'https://demo.mcaptcha.org/widget/?sitekey=Q3D8LBQqVbSLhdRHbHXdvj5GqE7sxaHV';
const MCAPTCHA_SCRIPT_SRC = 'https://cdn.mcaptcha.org/captcha.js';

/**
 * mCaptcha proof-of-work widget.
 *
 * Renders the DOM skeleton vanilla-glue expects (label with
 * data-mcaptcha_url + token input + container), loads the glue script,
 * then watches the token input until the challenge is solved.
 */
export function MCaptchaWidget({ onVerify, className = '' }: MCaptchaWidgetProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [verified, setVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    // vanilla-glue scans for these elements when it loads, so the DOM
    // skeleton must exist BEFORE the script tag is appended.
    // Build DOM nodes properly to avoid innerHTML issues
    const label = document.createElement('label');
    label.setAttribute('data-mcaptcha_url', MCAPTCHA_WIDGET_URL);
    label.setAttribute('for', 'mcaptcha__token');
    label.setAttribute('id', 'mcaptcha__token-label');
    label.className = 'sr-only';
    label.textContent = 'mCaptcha authorization token';

    const tokenInput = document.createElement('input');
    tokenInput.type = 'hidden';
    tokenInput.name = 'mcaptcha__token';
    tokenInput.id = 'mcaptcha__token';

    const widgetContainer = document.createElement('div');
    widgetContainer.id = 'mcaptcha__widget-container';
    widgetContainer.style.minHeight = '100px';

    root.appendChild(label);
    root.appendChild(tokenInput);
    root.appendChild(widgetContainer);

    // Load the glue script once per page
    if (!document.querySelector(`script[src="${MCAPTCHA_SCRIPT_SRC}"]`)) {
      const script = document.createElement('script');
      script.src = MCAPTCHA_SCRIPT_SRC;
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.onload = () => setIsLoading(false);
      script.onerror = () => {
        console.error('mCaptcha: failed to load vanilla-glue script');
        setIsLoading(false);
      };
      document.head.appendChild(script);
    }

    // Watch the hidden token input — vanilla-glue fills it once solved
    // Use the tokenInput we already created
    const interval = window.setInterval(() => {
      if (tokenInput.value) {
        window.clearInterval(interval);
        setVerified(true);
        onVerify(tokenInput.value);
      }
    }, 300);

    return () => {
      window.clearInterval(interval);
      while (root.firstChild) root.removeChild(root.firstChild);
    };
  }, [onVerify]);

  return (
    <div ref={rootRef} className={`mcaptcha-root ${className}`} style={{ minHeight: '120px' }}>
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Loading CAPTCHA...
            </p>
          </div>
        </div>
      )}
      {!isLoading && !verified && (
        <div className="text-center py-4">
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
            Complete the CAPTCHA to verify you are human.
          </p>
        </div>
      )}
      {verified && (
        <p className="text-sm text-emerald-500 mt-2" role="status">
          ✓ Verified
        </p>
      )}
    </div>
  );
}
