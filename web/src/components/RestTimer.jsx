import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from './Button';

function playBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    // Play three short beeps
    [0, 0.15, 0.3].forEach((delay) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      osc.type = 'sine';
      gain.gain.value = 0.3;
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.1);
    });
  } catch {
    // Web Audio not supported
  }
}

function vibrate() {
  if (navigator.vibrate) {
    navigator.vibrate([200, 100, 200]);
  }
}

export default function RestTimer({ seconds = 90, onComplete, autoStart = true }) {
  const [duration, setDuration] = useState(seconds);
  const [remaining, setRemaining] = useState(seconds);
  const [isRunning, setIsRunning] = useState(autoStart);
  const [isDone, setIsDone] = useState(false);
  const intervalRef = useRef(null);

  const finish = useCallback(() => {
    setIsRunning(false);
    setIsDone(true);
    playBeep();
    vibrate();
  }, []);

  useEffect(() => {
    if (!isRunning) return;

    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          finish();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [isRunning, finish]);

  const handleSkip = () => {
    clearInterval(intervalRef.current);
    setIsRunning(false);
    setIsDone(true);
    onComplete?.();
  };

  const handleAdd30 = () => {
    setDuration((d) => d + 30);
    setRemaining((r) => r + 30);
  };

  const handleSub30 = () => {
    setDuration((d) => Math.max(30, d - 30));
    setRemaining((r) => Math.max(1, r - 30));
  };

  const handleDismiss = () => {
    onComplete?.();
  };

  const pct = duration > 0 ? remaining / duration : 0;
  const circumference = 2 * Math.PI * 54;
  const offset = circumference * (1 - pct);

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-dark-800 border border-dark-600/50 rounded-xl p-6 flex flex-col items-center gap-4"
      >
        <span className="text-sm font-medium text-gray-400 uppercase tracking-wide">
          {isDone ? 'Rest Complete' : 'Rest Timer'}
        </span>

        {/* Circular timer */}
        <div className="relative w-36 h-36">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="54" fill="none" stroke="#1a1a25" strokeWidth="6" />
            <circle
              cx="60" cy="60" r="54"
              fill="none"
              stroke={isDone ? '#34d399' : '#22d3ee'}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="transition-all duration-1000 ease-linear"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-3xl font-mono font-bold text-gray-100">
              {isDone ? (
                <svg className="w-10 h-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                `${mins}:${secs.toString().padStart(2, '0')}`
              )}
            </span>
          </div>
        </div>

        {/* Controls */}
        {isDone ? (
          <Button onClick={handleDismiss} size="lg" className="w-full max-w-xs">
            Next Set
          </Button>
        ) : (
          <div className="flex items-center gap-3">
            <Button variant="secondary" size="sm" onClick={handleSub30}>
              -30s
            </Button>
            <Button variant="danger" size="md" onClick={handleSkip}>
              Skip
            </Button>
            <Button variant="secondary" size="sm" onClick={handleAdd30}>
              +30s
            </Button>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
