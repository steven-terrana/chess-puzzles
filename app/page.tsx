'use client';

import { useState, useEffect } from 'react';
import { ChessBoard } from '@/components/ChessBoard';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ChessProblem {
  problemid: string;
  fen: string;
  moves: string;
  first: string;
}

export default function Home() {
  const [problems, setProblems] = useState<ChessProblem[]>([]);
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);

  useEffect(() => {
    fetch('https://raw.githubusercontent.com/denialromeo/4462-chess-problems/refs/heads/master/problems.json')
      .then(res => res.json())
      .then(data => {
        setProblems(data.problems);
      })
      .catch(error => {
        console.error('Error loading problems:', error);
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

  if (!currentProblem) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen p-8 flex flex-col items-center gap-8">
      <h1 className="text-2xl font-bold">Chess Puzzles</h1>
      
      <div className="text-center mb-4">
        <p>Problem {currentProblemIndex + 1} of {problems.length}</p>
        <p>{currentProblem.first}</p>
      </div>

      <ChessBoard
        fen={currentProblem.fen}
        moves={currentProblem.moves}
        onCorrectMove={() => toast.success('Correct move!')}
        onIncorrectMove={() => toast.error('Incorrect move. Try again.')}
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
