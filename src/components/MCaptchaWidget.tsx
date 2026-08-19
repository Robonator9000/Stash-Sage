import { useEffect, useRef, useState } from 'react';

interface MCaptchaWidgetProps {
  onVerify: (token: string) => void;
  className?: string;
}

const MCAPTCHA_WIDGET_URL = 'https://demo.mcaptcha.org/widget/?sitekey=Q3D8LBQqVbSLhdRHbHXdvj5GqE7sxaHV';
const MCAPTCHA_SCRIPT_SRC = 'https://unpkg.com/@mcaptcha/vanilla-glue@0.1.0-rc2/dist/index.js';

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

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    // vanilla-glue scans for these elements when it loads, so the DOM
    // skeleton must exist BEFORE the script tag is appended.
    root.innerHTML = `
      <label
        data-mcaptcha_url="${MCAPTCHA_WIDGET_URL}"
        for="mcaptcha__token"
        id="mcaptcha__token-label"
        class="sr-only"
      >mCaptcha authorization token</label>
      <input type="hidden" name="mcaptcha__token" id="mcaptcha__token" />
      <div id="mcaptcha__widget-container"></div>
    `;

    // Load the glue script once per page
    if (!document.querySelector(`script[src="${MCAPTCHA_SCRIPT_SRC}"]`)) {
      const script = document.createElement('script');
      script.src = MCAPTCHA_SCRIPT_SRC;
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.onerror = () => console.error('mCaptcha: failed to load vanilla-glue script');
      document.head.appendChild(script);
    }

    // Watch the hidden token input — vanilla-glue fills it once solved
    const tokenInput = root.querySelector<HTMLInputElement>('#mcaptcha__token');
    const interval = window.setInterval(() => {
      if (tokenInput?.value) {
        window.clearInterval(interval);
        setVerified(true);
        onVerify(tokenInput.value);
      }
    }, 300);

    return () => {
      window.clearInterval(interval);
      root.innerHTML = '';
    };
  }, [onVerify]);

  return (
    <div ref={rootRef} className={`mcaptcha-root ${className}`}>
      {verified && (
        <p className="text-sm text-emerald-500 mt-2" role="status">
          ✓ Verified
        </p>
      )}
    </div>
  );
}
