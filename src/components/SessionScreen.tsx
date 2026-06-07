import { useState, useEffect, useCallback } from 'react';
import { Product, Session } from '../types';
import { generateId } from '../utils/helpers';
import { X, Play, Pause, RotateCcw, Users, Plus, Minus, Clock, Flame, Check } from 'lucide-react';

interface SessionScreenProps {
  product: Product;
  initialAmount: number;
  people: number;
  onFinish: (productId: string, amountUsed: number, session: Session) => void;
  onClose: () => void;
}

export function SessionScreen({ product, initialAmount, people, onFinish, onClose }: SessionScreenProps) {
  const [currentAmount, setCurrentAmount] = useState(initialAmount);
  const [hits, setHits] = useState(0);
  const [hitTimerSeconds, setHitTimerSeconds] = useState(10);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(10);
  const [currentPerson, setCurrentPerson] = useState(0);
  const [sessionNotes, setSessionNotes] = useState('');
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);

  const perPerson = initialAmount / people;

  // Timer logic
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    
    if (timerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            setTimerRunning(false);
            handleNextHit();
            return hitTimerSeconds;
          }
          return t - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerRunning, hitTimerSeconds]);

  const handleNextHit = useCallback(() => {
    setHits((h) => h + 1);
    setCurrentPerson((p) => (p + 1) % people);
    setTimeLeft(hitTimerSeconds);
    setTimerRunning(false);
  }, [people, hitTimerSeconds]);

  const adjustTimer = (delta: number) => {
    const newTime = Math.max(5, Math.min(120, hitTimerSeconds + delta));
    setHitTimerSeconds(newTime);
    setTimeLeft(newTime);
  };

  const adjustAmount = (delta: number) => {
    setCurrentAmount((a) => Math.max(0, a + delta));
  };

  const handleFinishSession = () => {
    const amountUsed = initialAmount - currentAmount;
    const session: Session = {
      id: generateId(),
      productId: product.id,
      productName: product.name,
      date: new Date(),
      amount: amountUsed,
      people,
      hitsCount: hits,
      notes: sessionNotes,
      bowlsPerPerson: people > 0 ? Math.round((amountUsed / people / 0.25) * 10) / 10 : 0,
    };

    onFinish(product.id, amountUsed, session);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}s`;
  };

  const timerProgress = ((hitTimerSeconds - timeLeft) / hitTimerSeconds) * 100;

  return (
    <div className="fixed inset-0 bg-slate-950 z-50 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-slate-900 border-b border-slate-800 px-4 py-4 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-cyan-500 to-emerald-500 flex items-center justify-center">
              <Flame className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">{product.name}</h1>
              <p className="text-sm text-slate-400">Session in progress</p>
            </div>
          </div>
          <button
            onClick={() => setShowFinishConfirm(true)}
            className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-emerald-500 text-white font-bold rounded-lg hover:from-cyan-400 hover:to-emerald-400 transition-all"
          >
            Finish
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-4">
        {/* Hit Timer */}
        <div className="bg-slate-900 border-2 border-slate-700 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-cyan-400" />
              Hit Timer
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => adjustTimer(-5)}
                className="w-8 h-8 rounded-lg bg-slate-700 text-white flex items-center justify-center hover:bg-slate-600 transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="text-lg font-bold text-white w-12 text-center">{hitTimerSeconds}s</span>
              <button
                onClick={() => adjustTimer(5)}
                className="w-8 h-8 rounded-lg bg-gradient-to-r from-cyan-600 to-emerald-600 text-white flex items-center justify-center hover:from-cyan-500 hover:to-emerald-500 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Timer Display */}
          <div className="relative w-48 h-48 mx-auto mb-4">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="96"
                cy="96"
                r="88"
                stroke="rgb(51, 65, 85)"
                strokeWidth="8"
                fill="none"
              />
              <circle
                cx="96"
                cy="96"
                r="88"
                stroke="url(#gradient)"
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={553}
                strokeDashoffset={553 - (553 * timerProgress) / 100}
                className="transition-all duration-1000"
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="rgb(6, 182, 212)" />
                  <stop offset="100%" stopColor="rgb(34, 197, 94)" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-5xl font-bold ${timeLeft <= 3 ? 'text-red-400' : 'text-white'}`}>
                {formatTime(timeLeft)}
              </span>
              {timerRunning && (
                <span className="text-sm text-slate-400 mt-1">Time remaining</span>
              )}
            </div>
          </div>

          {/* Timer Controls */}
          <div className="flex justify-center gap-3">
            <button
              onClick={() => {
                setTimerRunning(!timerRunning);
              }}
              className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                timerRunning
                  ? 'bg-amber-500 hover:bg-amber-400'
                  : 'bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400'
              }`}
            >
              {timerRunning ? (
                <Pause className="w-8 h-8 text-white" />
              ) : (
                <Play className="w-8 h-8 text-white ml-1" />
              )}
            </button>
            <button
              onClick={() => {
                setTimeLeft(hitTimerSeconds);
                setTimerRunning(false);
              }}
              className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center hover:bg-slate-600 transition-colors"
            >
              <RotateCcw className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>

        {/* Current Person */}
        <div className="bg-slate-900 border-2 border-slate-700 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-green-400" />
            Rotation
          </h2>
          
          <div className="flex flex-wrap gap-2 mb-4">
            {[...Array(people)].map((_, i) => (
              <div
                key={i}
                className={`flex-1 min-w-[60px] py-3 px-4 rounded-xl text-center font-bold transition-all ${
                  i === currentPerson
                    ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-white scale-105'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                P{i + 1}
              </div>
            ))}
          </div>

          <button
            onClick={handleNextHit}
            className="w-full py-4 bg-gradient-to-r from-cyan-500 to-emerald-500 text-white font-bold rounded-xl hover:from-cyan-400 hover:to-emerald-400 transition-all text-lg"
          >
            Next Hit →
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-900 border-2 border-slate-700 rounded-xl p-4">
            <p className="text-sm text-slate-400 mb-1">Total Hits</p>
            <p className="text-3xl font-bold text-white">{hits}</p>
          </div>
          <div className="bg-slate-900 border-2 border-slate-700 rounded-xl p-4">
            <p className="text-sm text-slate-400 mb-1">Avg/Person</p>
            <p className="text-3xl font-bold text-white">{people > 0 ? Math.floor(hits / people) : 0}</p>
          </div>
        </div>

        {/* Bowl Calculator */}
        <div className="bg-slate-900 border-2 border-slate-700 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white mb-4">Bowl Calculator</h2>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-slate-800 rounded-xl p-4 text-center">
              <p className="text-sm text-slate-400 mb-1">Started with</p>
              <p className="text-2xl font-bold text-white">{initialAmount.toFixed(2)}g</p>
            </div>
            <div className="bg-slate-800 rounded-xl p-4 text-center">
              <p className="text-sm text-slate-400 mb-1">Remaining</p>
              <p className="text-2xl font-bold text-cyan-400">{currentAmount.toFixed(2)}g</p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-cyan-900/50 to-emerald-900/50 rounded-xl p-4 mb-4">
            <p className="text-sm text-slate-400 mb-1">Per Person</p>
            <p className="text-2xl font-bold text-white">{perPerson.toFixed(2)}g</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-200">Adjust Remaining</label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => adjustAmount(-0.1)}
                className="w-12 h-12 rounded-xl bg-slate-700 text-white flex items-center justify-center hover:bg-slate-600 transition-colors font-bold"
              >
                -0.1
              </button>
              <button
                onClick={() => adjustAmount(-0.05)}
                className="w-12 h-12 rounded-xl bg-slate-700 text-white flex items-center justify-center hover:bg-slate-600 transition-colors font-bold text-xs"
              >
                -0.05
              </button>
              <div className="flex-1 text-center">
                <span className="text-2xl font-bold text-white">{currentAmount.toFixed(2)}g</span>
              </div>
              <button
                onClick={() => adjustAmount(0.05)}
                className="w-12 h-12 rounded-xl bg-slate-700 text-white flex items-center justify-center hover:bg-slate-600 transition-colors font-bold text-xs"
              >
                +0.05
              </button>
              <button
                onClick={() => adjustAmount(0.1)}
                className="w-12 h-12 rounded-xl bg-gradient-to-r from-cyan-600 to-emerald-600 text-white flex items-center justify-center hover:from-cyan-500 hover:to-emerald-500 transition-colors font-bold"
              >
                +0.1
              </button>
            </div>
          </div>
        </div>

        {/* Session Notes */}
        <div className="bg-slate-900 border-2 border-slate-700 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white mb-4">Session Notes</h2>
          <textarea
            value={sessionNotes}
            onChange={(e) => setSessionNotes(e.target.value)}
            placeholder="How's the session? Effects, vibes, etc..."
            className="w-full h-24 bg-slate-800 border-slate-600 text-white placeholder-slate-500 rounded-xl p-4 resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
          />
        </div>
      </div>

      {/* Finish Confirmation Modal */}
      {showFinishConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border-2 border-slate-700 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
            <div className="p-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500 flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white text-center mb-2">Finish Session?</h3>
              <p className="text-slate-400 text-center mb-4">
                You've had <span className="font-bold text-white">{hits} hits</span> and used{' '}
                <span className="font-bold text-cyan-400">{(initialAmount - currentAmount).toFixed(2)}g</span>
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowFinishConfirm(false)}
                  className="flex-1 py-3 bg-slate-700 text-white font-bold rounded-xl hover:bg-slate-600 transition-colors"
                >
                  Continue
                </button>
                <button
                  onClick={handleFinishSession}
                  className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-emerald-500 text-white font-bold rounded-xl hover:from-cyan-400 hover:to-emerald-400 transition-all"
                >
                  Finish
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}