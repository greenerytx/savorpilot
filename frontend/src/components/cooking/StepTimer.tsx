import { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, RotateCcw, Volume2 } from 'lucide-react';
import { Button } from '../ui';
import { cn } from '../../lib/utils';

interface StepTimerProps {
  duration: number; // in minutes
  onComplete?: () => void;
  className?: string;
}

export function StepTimer({ duration, onComplete, className }: StepTimerProps) {
  const [timeLeft, setTimeLeft] = useState(duration * 60); // Convert to seconds
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate progress percentage
  const progress = ((duration * 60 - timeLeft) / (duration * 60)) * 100;

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            setIsComplete(true);
            playAlarm();
            onComplete?.();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeLeft, onComplete]);

  // Play alarm sound
  const playAlarm = useCallback(() => {
    // Create a simple beep using Web Audio API
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

      const playBeep = (startTime: number) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 880; // A5 note
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.3, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);

        oscillator.start(startTime);
        oscillator.stop(startTime + 0.3);
      };

      // Play 3 beeps
      playBeep(audioContext.currentTime);
      playBeep(audioContext.currentTime + 0.4);
      playBeep(audioContext.currentTime + 0.8);
    } catch (e) {
      console.warn('Could not play timer sound:', e);
    }
  }, []);

  const handleStart = () => {
    setIsRunning(true);
    setIsComplete(false);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setTimeLeft(duration * 60);
    setIsRunning(false);
    setIsComplete(false);
  };

  // Reset when duration changes
  useEffect(() => {
    setTimeLeft(duration * 60);
    setIsRunning(false);
    setIsComplete(false);
  }, [duration]);

  return (
    <div className={cn('flex items-center gap-4', className)}>
      {/* Circular progress indicator */}
      <div className="relative w-20 h-20">
        <svg className="w-full h-full transform -rotate-90">
          {/* Background circle */}
          <circle
            cx="40"
            cy="40"
            r="36"
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            className="text-neutral-200"
          />
          {/* Progress circle */}
          <circle
            cx="40"
            cy="40"
            r="36"
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 36}`}
            strokeDashoffset={`${2 * Math.PI * 36 * (1 - progress / 100)}`}
            className={cn(
              'transition-all duration-1000',
              isComplete ? 'text-green-500' : 'text-primary-500'
            )}
          />
        </svg>
        {/* Time display */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn(
            'text-lg font-mono font-bold',
            isComplete ? 'text-green-600' : 'text-neutral-800'
          )}>
            {formatTime(timeLeft)}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-2">
        {!isRunning ? (
          <Button
            size="sm"
            variant={isComplete ? 'secondary' : 'primary'}
            onClick={handleStart}
            disabled={timeLeft === 0}
          >
            <Play className="w-4 h-4" />
            {isComplete ? 'Restart' : 'Start'}
          </Button>
        ) : (
          <Button size="sm" variant="secondary" onClick={handlePause}>
            <Pause className="w-4 h-4" />
            Pause
          </Button>
        )}
        <Button size="sm" variant="ghost" onClick={handleReset}>
          <RotateCcw className="w-4 h-4" />
        </Button>
      </div>

      {/* Complete indicator */}
      {isComplete && (
        <div className="flex items-center gap-2 text-green-600 font-medium animate-pulse">
          <Volume2 className="w-5 h-5" />
          Timer complete!
        </div>
      )}
    </div>
  );
}
