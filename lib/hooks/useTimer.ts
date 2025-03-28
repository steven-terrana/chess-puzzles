import { useState, useEffect } from 'react';

interface TimerStats {
  puzzles: Record<string, {
    timeSpent: number;  // in seconds
    completed: boolean;
  }>;
  totalTimeSpent: number;  // in seconds
}

const DEFAULT_TIMER_STATS: TimerStats = {
  puzzles: {},
  totalTimeSpent: 0,
};

export function useTimer(puzzleId: string | null) {
  const [isRunning, setIsRunning] = useState(true);
  const [timerStats, setTimerStats] = useState<TimerStats>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('puzzleTimerStats');
      return saved ? JSON.parse(saved) : DEFAULT_TIMER_STATS;
    }
    return DEFAULT_TIMER_STATS;
  });

  // Current puzzle timer
  useEffect(() => {
    if (!puzzleId || !isRunning) return;

    const interval = setInterval(() => {
      setTimerStats(prev => {
        const puzzleStats = prev.puzzles[puzzleId] || { timeSpent: 0, completed: false };
        return {
          ...prev,
          totalTimeSpent: prev.totalTimeSpent + 1,
          puzzles: {
            ...prev.puzzles,
            [puzzleId]: {
              ...puzzleStats,
              timeSpent: puzzleStats.timeSpent + 1,
            },
          },
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [puzzleId, isRunning]);

  // Save timer stats to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('puzzleTimerStats', JSON.stringify(timerStats));
    }
  }, [timerStats]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getCurrentPuzzleTime = (): number => {
    if (!puzzleId) return 0;
    return timerStats.puzzles[puzzleId]?.timeSpent || 0;
  };

  const getTotalTime = (): number => {
    return timerStats.totalTimeSpent;
  };

  const pauseTimer = () => setIsRunning(false);
  const resumeTimer = () => setIsRunning(true);
  const resetPuzzleTimer = (id: string) => {
    setTimerStats(prev => ({
      ...prev,
      puzzles: {
        ...prev.puzzles,
        [id]: { timeSpent: 0, completed: false },
      },
    }));
  };

  const markPuzzleComplete = (id: string) => {
    setTimerStats(prev => ({
      ...prev,
      puzzles: {
        ...prev.puzzles,
        [id]: {
          ...prev.puzzles[id],
          completed: true,
        },
      },
    }));
    pauseTimer();
  };

  return {
    isRunning,
    formatTime,
    getCurrentPuzzleTime,
    getTotalTime,
    pauseTimer,
    resumeTimer,
    resetPuzzleTimer,
    markPuzzleComplete,
  };
}
