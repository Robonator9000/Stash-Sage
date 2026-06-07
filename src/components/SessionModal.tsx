import { useState, useEffect, useCallback } from 'react';
import { Product, Session } from '../types';
import { useSettings } from '../utils/useSettings';
import { t } from '../utils/translations';
import { X, Users, Clock, Play, Pause, RotateCcw, Calculator, ArrowRight } from 'lucide-react';

interface SessionModalProps {
  product: Product;
  initialAmount: number;
  people: number;
  onFinish: (productId: string, amountUsed: number, session: Session) => void;
  onClose: () => void;
  isDark?: boolean;
  autoStartTimer?: boolean;
  defaultHitTimer?: number;
}

export function SessionModal({
  product,
  initialAmount,
  people,
  onFinish,
  onClose,
  isDark = true,
  autoStartTimer = false,
  defaultHitTimer = 10,
}: SessionModalProps) {
  const { settings } = useSettings();
  const [amountUsed, setAmountUsed] = useState(initialAmount);
  const [hitsCount, setHitsCount] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(autoStartTimer);
  const [timerSeconds, setTimerSeconds] = useState(defaultHitTimer);
  const [customTimerDuration, setCustomTimerDuration] = useState(defaultHitTimer);
  const [sessionNotes, setSessionNotes] = useState('');
  const [gramsPerBowl, setGramsPerBowl] = useState(settings.sessionDefaults.defaultGramsPerBowl);
  const [showCalculator, setShowCalculator] = useState(false);
  const [currentPerson, setCurrentPerson] = useState(0);
  const [personHits, setPersonHits] = useState<number[]>(() => new Array(people).fill(0));

  const rotationEnabled = settings.sessionDefaults.rotationEnabled && people > 1;

  useEffect(() => {
    setPersonHits(new Array(people).fill(0));
    setCurrentPerson(0);
  }, [people]);

  const handleHit = useCallback(() => {
    setHitsCount((prev) => prev + 1);
    setPersonHits((prev) => {
      const next = [...prev];
      next[currentPerson] = (next[currentPerson] || 0) + 1;
      return next;
    });
    setCurrentPerson((p) => (p + 1) % people);
  }, [currentPerson, people]);

  // Calculate bowls per person automatically
  const gramsPerPerson = people > 0 ? amountUsed / people : 0;
  const bowlsPerPerson = gramsPerPerson / gramsPerBowl;

  // Timer logic
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds]);

  const handleFinishSession = () => {
    const session: Session = {
      id: Date.now().toString(),
      productId: product.id,
      productName: product.name,
      date: new Date(),
      amount: amountUsed,
      people,
      hitsCount,
      notes: sessionNotes,
      bowlsPerPerson: Math.round(bowlsPerPerson * 10) / 10,
      personHits: rotationEnabled ? personHits : undefined,
      rotationEnabled: rotationEnabled || undefined,
    };
    onFinish(product.id, amountUsed, session);
  };

  const resetTimer = () => {
    setTimerSeconds(customTimerDuration);
    setIsTimerRunning(false);
  };

  const startTimer = () => {
    setTimerSeconds(customTimerDuration);
    setIsTimerRunning(true);
  };

  const pauseTimer = () => {
    setIsTimerRunning(false);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`w-full max-w-md rounded-2xl border-2 overflow-hidden shadow-2xl flex flex-col max-h-[90vh] ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'
      }`}>
        {/* Header - Fixed */}
        <div className={`flex items-center justify-between p-5 border-b flex-shrink-0 ${
          isDark ? 'border-slate-800' : 'border-gray-200'
        }`}>
          <div>
            <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {t('session', settings.language)}
            </h2>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
              {product.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition-colors ${
              isDark 
                ? 'hover:bg-slate-800 text-slate-400 hover:text-white' 
                : 'hover:bg-gray-100 text-gray-400 hover:text-gray-900'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div 
          className="p-5 space-y-5 overflow-y-auto flex-1"
          style={{ scrollbarGutter: 'stable' }}
        >
          {/* People & Stats */}
          <div className={`p-3 rounded-xl space-y-3 ${
            isDark ? 'bg-slate-800' : 'bg-gray-100'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className={`w-5 h-5 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
                <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {people} {people === 1 ? t('person', settings.language) : t('people', settings.language)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                  {t('hits', settings.language)}:
                </span>
                <span className={`font-bold w-8 text-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {hitsCount}
                </span>
              </div>
            </div>

            {rotationEnabled && (
              <>
                {/* Person Indicators */}
                <div className="flex gap-1.5">
                  {Array.from({ length: people }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPerson(i)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        i === currentPerson
                          ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-white shadow-lg scale-105'
                          : isDark
                            ? 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                            : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                      }`}
                    >
                      P{i + 1}
                    </button>
                  ))}
                </div>

                {/* Per-Person Hit Counts */}
                <div className="flex gap-1.5">
                  {personHits.map((hits, i) => (
                    <div
                      key={i}
                      className={`flex-1 text-center text-xs py-1 rounded-md ${
                        i === currentPerson
                          ? isDark ? 'bg-cyan-500/20 text-cyan-400' : 'bg-cyan-100 text-cyan-700'
                          : isDark ? 'text-slate-500' : 'text-gray-400'
                      }`}
                    >
                      {hits}
                    </div>
                  ))}
                </div>

                {/* Next Hit Button */}
                <button
                  onClick={handleHit}
                  className={`w-full py-2 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
                    isDark
                      ? 'bg-cyan-600 text-white hover:bg-cyan-500'
                      : 'bg-cyan-500 text-white hover:bg-cyan-400'
                  }`}
                >
                  <ArrowRight className="w-4 h-4" />
                  {t('nextHit', settings.language)} — P{(currentPerson % people) + 1}
                </button>
              </>
            )}

            {!rotationEnabled && (
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => setHitsCount(Math.max(0, hitsCount - 1))}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
                    isDark ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  -
                </button>
                <button
                  onClick={() => setHitsCount(hitsCount + 1)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
                    isDark ? 'bg-cyan-600 text-white hover:bg-cyan-500' : 'bg-cyan-500 text-white hover:bg-cyan-400'
                  }`}
                >
                  +
                </button>
              </div>
            )}
          </div>

          {/* Amount Used */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              isDark ? 'text-slate-300' : 'text-gray-700'
            }`}>
              {t('amountUsed', settings.language)} (g)
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              max={product.amount}
              value={amountUsed}
              onChange={(e) => setAmountUsed(parseFloat(e.target.value) || 0)}
              className={`w-full px-4 py-3 rounded-xl border-2 transition-colors ${
                isDark 
                  ? 'bg-slate-800 border-slate-700 text-white focus:border-cyan-500' 
                  : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-cyan-500'
              }`}
            />
          </div>

          {/* Bowl Calculator - Collapsible */}
          <div className={`rounded-xl border-2 overflow-hidden ${
            isDark ? 'border-slate-800 bg-slate-800/50' : 'border-gray-200 bg-gray-50'
          }`}>
            <button
              onClick={() => setShowCalculator(!showCalculator)}
              className={`w-full flex items-center justify-between p-3 transition-colors ${
                isDark ? 'hover:bg-slate-800' : 'hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-2">
                <Calculator className={`w-5 h-5 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {t('bowlCalculator', settings.language)}
                </span>
              </div>
              <span className={`text-lg font-bold ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                {bowlsPerPerson.toFixed(1)} {t('bowlsPerPerson', settings.language)}
              </span>
            </button>

            {showCalculator && (
              <div className={`p-4 border-t space-y-3 ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
                {/* Grams per bowl setting */}
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                    {t('gramsPerBowl', settings.language)}
                  </span>
                  <select
                    value={gramsPerBowl}
                    onChange={(e) => setGramsPerBowl(parseFloat(e.target.value))}
                    className={`px-3 py-1.5 rounded-lg border-2 text-sm font-medium ${
                      isDark 
                        ? 'bg-slate-900 border-slate-700 text-white' 
                        : 'bg-white border-gray-200 text-gray-900'
                    }`}
                  >
                    <option value={0.15}>0.15g</option>
                    <option value={0.2}>0.2g</option>
                    <option value={0.25}>0.25g</option>
                    <option value={0.3}>0.3g</option>
                    <option value={0.35}>0.35g</option>
                    <option value={0.4}>0.4g</option>
                    <option value={0.5}>0.5g</option>
                  </select>
                </div>

                {/* Calculation breakdown */}
                <div className={`p-3 rounded-lg space-y-2 ${
                  isDark ? 'bg-slate-900' : 'bg-white'
                }`}>
                  <div className="flex justify-between text-sm">
                    <span className={isDark ? 'text-slate-400' : 'text-gray-500'}>
                      {t('totalAmount', settings.language)}:
                    </span>
                    <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {amountUsed.toFixed(2)}g
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className={isDark ? 'text-slate-400' : 'text-gray-500'}>
                      {t('people', settings.language)}:
                    </span>
                    <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {people}
                    </span>
                  </div>
                  <div className={`border-t pt-2 ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
                    <div className="flex justify-between text-sm">
                      <span className={isDark ? 'text-slate-400' : 'text-gray-500'}>
                        {t('gramsPerPerson', settings.language)}:
                      </span>
                      <span className={`font-bold ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>
                        {gramsPerPerson.toFixed(2)}g
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className={isDark ? 'text-slate-400' : 'text-gray-500'}>
                      {t('totalBowls', settings.language)}:
                    </span>
                    <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {(amountUsed / gramsPerBowl).toFixed(1)}
                    </span>
                  </div>
                  <div className={`border-t pt-2 ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
                    <div className="flex justify-between">
                      <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {t('bowlsPerPerson', settings.language)}:
                      </span>
                      <span className={`text-xl font-bold ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                        {bowlsPerPerson.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Timer */}
          <div className={`p-4 rounded-xl border-2 ${
            isDark ? 'border-slate-800 bg-slate-800/50' : 'border-gray-200 bg-gray-50'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Clock className={`w-5 h-5 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
                <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {t('hitTimer', settings.language)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {!isTimerRunning && (
                  <div className="flex items-center gap-1 mr-2">
                    <button
                      onClick={() => {
                        const next = Math.max(1, customTimerDuration - 5);
                        setCustomTimerDuration(next);
                      }}
                      className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${
                        isDark ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      max="999"
                      value={customTimerDuration}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 1;
                        setCustomTimerDuration(val);
                      }}
                      className={`w-12 text-center text-xs font-bold rounded border-2 outline-none ${
                        isDark
                          ? 'bg-slate-700 border-slate-600 text-white'
                          : 'bg-gray-200 border-gray-300 text-gray-900'
                      }`}
                    />
                    <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>s</span>
                    <button
                      onClick={() => {
                        const next = customTimerDuration + 5;
                        setCustomTimerDuration(next);
                      }}
                      className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${
                        isDark ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      +
                    </button>
                  </div>
                )}
                <div className={`text-2xl font-mono font-bold ${
                  timerSeconds <= 3 ? 'text-red-400' : isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  {Math.floor(timerSeconds / 60)}:{(timerSeconds % 60).toString().padStart(2, '0')}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              {!isTimerRunning ? (
                <button
                  onClick={startTimer}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-medium transition-colors ${
                    isDark 
                      ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' 
                      : 'bg-green-50 text-green-600 hover:bg-green-100'
                  }`}
                >
                  <Play className="w-4 h-4" />
                  {t('start', settings.language)}
                </button>
              ) : (
                <button
                  onClick={pauseTimer}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-medium transition-colors ${
                    isDark 
                      ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30' 
                      : 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                  }`}
                >
                  <Pause className="w-4 h-4" />
                  {t('pause', settings.language)}
                </button>
              )}
              <button
                onClick={resetTimer}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isDark 
                    ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' 
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                }`}
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              isDark ? 'text-slate-300' : 'text-gray-700'
            }`}>
              {t('sessionNotes', settings.language)}
            </label>
            <textarea
              value={sessionNotes}
              onChange={(e) => setSessionNotes(e.target.value)}
              placeholder={t('sessionNotesPlaceholder', settings.language)}
              rows={2}
              className={`w-full px-4 py-3 rounded-xl border-2 transition-colors resize-none ${
                isDark 
                  ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-cyan-500' 
                  : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-cyan-500'
              }`}
            />
          </div>
        </div>

        {/* Footer - Fixed */}
        <div className={`flex items-center gap-3 p-5 border-t flex-shrink-0 ${
          isDark ? 'border-slate-800' : 'border-gray-200'
        }`}>
          <button
            onClick={onClose}
            className={`flex-1 py-3 rounded-xl font-medium transition-colors ${
              isDark 
                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {t('cancel', settings.language)}
          </button>
          <button
            onClick={handleFinishSession}
            className={`flex-1 py-3 rounded-xl font-bold transition-all ${
              isDark 
                ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-white hover:from-cyan-400 hover:to-emerald-400' 
                : 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-white hover:from-cyan-400 hover:to-emerald-400'
            }`}
          >
            {t('finishSession', settings.language)}
          </button>
        </div>
      </div>
    </div>
  );
}