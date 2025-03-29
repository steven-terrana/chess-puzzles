import { useState, useEffect } from 'react';

interface PuzzleStats {
  attempts: number;
  completed: boolean;
  successfulAttempts: number;
}

interface UserStats {
  puzzles: Record<string, PuzzleStats>;  // Map of puzzle ID to its stats
  totalAttempts: number;
  successfulAttempts: number;
  currentStreak: number;
}

const DEFAULT_STATS: UserStats = {
  puzzles: {},
  totalAttempts: 0,
  successfulAttempts: 0,
  currentStreak: 0,
};

export function useUserStats() {
  const [stats, setStats] = useState<UserStats>(DEFAULT_STATS);

  // Load stats from localStorage on mount
  useEffect(() => {
    try {
      const savedStats = localStorage.getItem('chessStats');
      if (savedStats) {
        const parsed = JSON.parse(savedStats);
        // Ensure the parsed stats have the correct structure
        setStats({
          puzzles: parsed.puzzles || {},
          totalAttempts: parsed.totalAttempts || 0,
          successfulAttempts: parsed.successfulAttempts || 0,
          currentStreak: parsed.currentStreak || 0,
        });
      }
    } catch (error) {
      console.error('Error loading stats:', error);
      setStats(DEFAULT_STATS);
    }
  }, []);

  // Save stats to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('chessStats', JSON.stringify(stats));
    } catch (error) {
      console.error('Error saving stats:', error);
    }
  }, [stats]);

  const recordPuzzleAttempt = (puzzleId: string, isSuccess: boolean) => {
    setStats(prevStats => {
      const puzzleStats = prevStats.puzzles[puzzleId] || {
        attempts: 0,
        completed: false,
        successfulAttempts: 0,
      };

      const newStats = {
        ...prevStats,
        totalAttempts: prevStats.totalAttempts + 1,
        successfulAttempts: isSuccess ? prevStats.successfulAttempts + 1 : prevStats.successfulAttempts,
        currentStreak: isSuccess ? prevStats.currentStreak + 1 : 0,
        puzzles: {
          ...prevStats.puzzles,
          [puzzleId]: {
            ...puzzleStats,
            attempts: puzzleStats.attempts + 1,
            successfulAttempts: isSuccess ? puzzleStats.successfulAttempts + 1 : puzzleStats.successfulAttempts,
            completed: isSuccess ? true : puzzleStats.completed,
          },
        },
      };

      return newStats;
    });
  };

  const isPuzzleCompleted = (puzzleId: string): boolean => {
    return stats.puzzles?.[puzzleId]?.completed || false;
  };

  const getPuzzleStats = (puzzleId: string): PuzzleStats | null => {
    return stats.puzzles?.[puzzleId] || null;
  };

  const getSuccessRate = (): number => {
    if (stats.totalAttempts === 0) return 0;
    return (stats.successfulAttempts / stats.totalAttempts) * 100;
  };

  const getCompletedPuzzleCount = (): number => {
    if (!stats.puzzles) return 0;
    return Object.values(stats.puzzles).filter(puzzle => puzzle?.completed).length;
  };

  return {
    stats,
    recordPuzzleAttempt,
    isPuzzleCompleted,
    getPuzzleStats,
    getSuccessRate,
    getCompletedPuzzleCount,
  };
}
