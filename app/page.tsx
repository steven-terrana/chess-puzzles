'use client';

import { useState, useEffect } from 'react';
import { ChessBoard } from '@/components/ChessBoard';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useUserStats } from '@/lib/hooks/useUserStats';

interface ChessProblem {
  problemid: string;
  fen: string;
  moves: string;
  first: string;
}

export default function Home() {
  const [problems, setProblems] = useState<ChessProblem[]>([]);
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { stats, recordPuzzleAttempt, isPuzzleCompleted, getPuzzleStats, getSuccessRate, getCompletedPuzzleCount } = useUserStats();

  useEffect(() => {
    setIsLoading(true);
    fetch('https://raw.githubusercontent.com/denialromeo/4462-chess-problems/refs/heads/master/problems.json')
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

  const currentProblem = problems[currentProblemIndex];

  const handleNextProblem = () => {
    if (currentProblemIndex < problems.length - 1) {
      setCurrentProblemIndex(currentProblemIndex + 1);
    }
  };

  const handlePreviousProblem = () => {
    if (currentProblemIndex > 0) {
      setCurrentProblemIndex(currentProblemIndex - 1);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading puzzles...</div>;
  }

  if (!currentProblem || !problems.length) {
    return <div className="flex items-center justify-center h-screen">No puzzles available</div>;
  }

  return (
    <div className="min-h-screen p-8 flex flex-col items-center gap-8">
      <h1 className="text-2xl font-bold">Chess Puzzles</h1>
      
      <div className="text-center mb-4">
        <p>Problem {currentProblemIndex + 1} of {problems.length}</p>
        <p>{currentProblem.first}</p>
        <div className="mt-4 text-sm text-gray-600">
          <p>Completed: {getCompletedPuzzleCount()} puzzles</p>
          <p>Overall Success Rate: {getSuccessRate().toFixed(1)}%</p>
          <p>Total Attempts: {stats.totalAttempts}</p>
          
          <div className="mt-2 p-2 bg-gray-50 rounded-md">
            <p className="font-medium text-gray-700">Current Puzzle Stats:</p>
            {currentProblem && (
              <>
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
        onPuzzleComplete={() => toast.success('Puzzle completed! 🎉')}
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
