'use client';

import { useEffect, useRef, useState } from 'react';

interface CapWidgetProps {
  onSuccess: (token: string) => void;
  className?: string;
}

export function CapWidget({ onSuccess, className = '' }: CapWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [a, setA] = useState(0);
  const [b, setB] = useState(0);
  const [answer, setAnswer] = useState('');
  const [message, setMessage] = useState('');
  const [verified, setVerified] = useState(false);

  // Generate new math problem on mount
  useEffect(() => {
    setA(Math.floor(Math.random() * 10));
    setB(Math.floor(Math.random() * 10));
  }, []);

  const handleVerify = () => {
    const val = parseInt(answer, 10);
    if (!isNaN(val) && val === a + b) {
      setMessage('');
      setVerified(true);
      onSuccess(`math-${a}-${b}-${Date.now()}`);
    } else {
      setMessage('Incorrect answer, please try again.');
      // Generate new problem for next attempt
      setA(Math.floor(Math.random() * 10));
      setB(Math.floor(Math.random() * 10));
      setAnswer('');
    }
  };

  return (
    <div ref={containerRef} className={className}>
      <div className="flex flex-col items-center gap-2">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          What is <strong>{a}</strong> + <strong>{b}</strong>?
        </p>
        <input
          type="number"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          className="w-20 text-center border rounded px-2 py-1"
          placeholder="Answer"
        />
        <button
          onClick={handleVerify}
          className={`px-3 py-1 bg-cyan-600 text-white rounded hover:bg-cyan-500 ${
            verified ? 'bg-green-600 hover:bg-green-500' : ''
          }`}
          disabled={verified}
        >
          {verified ? 'Verified ✅' : 'Check Answer'}
        </button>
        {message && <p className="text-sm text-red-500 dark:text-red-400">{message}</p>}
      </div>
    </div>
  );
}