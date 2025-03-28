'use client';

import { useState, useEffect } from 'react';
import { ChessBoard } from '@/components/ChessBoard';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useUserStats } from '@/lib/hooks/useUserStats';
import { useTimer } from '@/lib/hooks/useTimer';

// Represents a single chess problem
interface ChessProblem {
  problemid: string;
  fen: string; // The starting position of the board
  moves: string; // The expected moves to solve the puzzle
  first: string; // The first move of the puzzle
}

export default function Home() {
  // State variables
  const [problems, setProblems] = useState<ChessProblem[]>([]); // All the chess problems
  const [currentProblemIndex, setCurrentProblemIndex] = useState(() => {
    // If the user has previously visited the page, load the last puzzle they were on
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('currentPuzzleIndex');
      return saved ? parseInt(saved, 10) : 0;
    }
    return 0;
  });
  const [isLoading, setIsLoading] = useState(true); // Whether or not the page is loading
  const { stats, recordPuzzleAttempt, isPuzzleCompleted, getPuzzleStats, getSuccessRate, getCompletedPuzzleCount } = useUserStats();
  const currentProblem = problems[currentProblemIndex];
  const { formatTime, getCurrentPuzzleTime, getTotalTime, markPuzzleComplete } = useTimer(
    currentProblem?.problemid || null // The ID of the current puzzle
  );

  useEffect(() => {
    // Load the chess problems when the page loads
    setIsLoading(true);
    fetch('/problems.json')
      .then(res => res.json())
      .then(data => {
        if (data.problems && Array.isArray(data.problems) && data.problems.length > 0) {
          setProblems(data.problems);
        } else {
          console.error('Invalid or empty problems data');
        }
        setIsLoading(false);
      })
      .catch(error => {
        console.error('Error loading problems:', error);
        setIsLoading(false);
      });
  }, []);

  // Save the current puzzle index to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('currentPuzzleIndex', currentProblemIndex.toString());
    }
  }, [currentProblemIndex]);

  const handleNextProblem = () => {
    // Go to the next puzzle if there is one
    if (currentProblemIndex < problems.length - 1) {
      setCurrentProblemIndex(currentProblemIndex + 1);
    }
  };

  const handlePreviousProblem = () => {
    // Go to the previous puzzle if there is one
    if (currentProblemIndex > 0) {
      setCurrentProblemIndex(currentProblemIndex - 1);
    }
  };

  if (isLoading) {
    // If the page is loading, show a loading message
    return <div className="flex items-center justify-center h-screen">Loading puzzles...</div>;
  }

  if (!currentProblem || !problems.length) {
    // If there are no puzzles, show an error message
    return <div className="flex items-center justify-center h-screen">No puzzles available</div>;
  }

  return (
    <div className="min-h-screen p-8 flex flex-col items-center gap-8">
      <h1 className="text-2xl font-bold">Chess Puzzles</h1>
      
      <div className="text-center mb-4">
        <p>Problem {currentProblemIndex + 1} of {problems.length}</p>
        <p>{currentProblem.first}</p>
        <p>{currentProblem.type}</p>
        <div className="mt-4 text-sm text-gray-600">
          <p>Completed: {getCompletedPuzzleCount()} puzzles</p>
          <p>Overall Success Rate: {getSuccessRate().toFixed(1)}%</p>
          <p>Total Attempts: {stats.totalAttempts}</p>
          <p>Total Time: {formatTime(getTotalTime())}</p>
          
          <div className="mt-2 p-2 bg-gray-50 rounded-md">
            <p className="font-medium text-gray-700">Current Puzzle Stats:</p>
            {currentProblem && (
              <>
                <p>Time Spent: {formatTime(getCurrentPuzzleTime())}</p>
                <p>Attempts: {getPuzzleStats(currentProblem.problemid)?.attempts || 0}</p>
                <p>Success Rate: {(() => {
                  const stats = getPuzzleStats(currentProblem.problemid);
                  if (!stats || !stats.attempts) return '0.0';
                  return ((stats.successfulAttempts / stats.attempts) * 100).toFixed(1);
                })()}%</p>
                {isPuzzleCompleted(currentProblem.problemid) && (
                  <p className="text-green-600 font-medium">✓ Completed</p>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <ChessBoard
        fen={currentProblem.fen}
        moves={currentProblem.moves}
        onCorrectMove={() => {
          toast.success('Correct move!');
          recordPuzzleAttempt(currentProblem.problemid, true);
        }}
        onIncorrectMove={() => {
          toast.error('Incorrect move. Try again.');
          recordPuzzleAttempt(currentProblem.problemid, false);
        }}
        onPuzzleComplete={() => {
          toast.success('Puzzle completed! 🎉');
          markPuzzleComplete(currentProblem.problemid);
        }}
        onNextPuzzle={handleNextProblem}
      />

      <div className="flex gap-4">
        <Button
          onClick={handlePreviousProblem}
          disabled={currentProblemIndex === 0}
        >
          Previous
        </Button>
        <Button
          onClick={handleNextProblem}
          disabled={currentProblemIndex === problems.length - 1}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
