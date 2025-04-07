'use client';

import { useState, useEffect } from 'react';
import { ChessBoard } from '@/components/ChessBoard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from 'sonner';
import { useUserStats } from '@/lib/hooks/useUserStats';
import { useTimer } from '@/lib/hooks/useTimer';
import { Chessboard } from 'react-chessboard';
import { useRouter, useSearchParams } from 'next/navigation';

// Represents a single chess problem
interface ChessProblem {
  problemid: string;
  fen: string; // The starting position of the board
  moves: string; // The expected moves to solve the puzzle
  first: string; // The first move of the puzzle
  type: string;
}

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // State variables
  const [problems, setProblems] = useState<ChessProblem[]>([]); // All the chess problems
  const [currentProblemIndex, setCurrentProblemIndex] = useState(() => {
    const puzzleParam = searchParams.get('puzzle');
    if (puzzleParam) {
      const index = parseInt(puzzleParam) - 1;
      return index >= 0 ? index : 0;
    }
    // If no URL param, check localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('currentPuzzleIndex');
      return saved ? parseInt(saved, 10) : 0;
    }
    return 0;
  });
  const [isLoading, setIsLoading] = useState(true); // Whether or not the page is loading
  const [isEditingPuzzleNumber, setIsEditingPuzzleNumber] = useState(false);
  const { recordPuzzleAttempt, stats } = useUserStats();
  const currentProblem = problems[currentProblemIndex];
  const { markPuzzleComplete } = useTimer(
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

  // Update URL when puzzle changes
  useEffect(() => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('puzzle', (currentProblemIndex + 1).toString());
    router.push(`/?${newParams.toString()}`);
  }, [currentProblemIndex, router]);

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
    <div className="p-8">
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader className="relative">
          <div className="absolute right-4 top-4">
            <a 
              href={`https://www.chess.com/analysis?fen=${encodeURIComponent(currentProblem.fen)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-gray-700"
              title="Analyze on Chess.com"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                <polyline points="15 3 21 3 21 9"></polyline>
                <line x1="10" y1="14" x2="21" y2="3"></line>
              </svg>
            </a>
          </div>
          <CardTitle>
            {isEditingPuzzleNumber ? (
              <input
                type="number"
                className="w-24 text-xl font-bold text-center border rounded"
                value={currentProblemIndex + 1}
                min={1}
                max={problems.length}
                onChange={(e) => {
                  const newIndex = Math.min(Math.max(parseInt(e.target.value) - 1, 0), problems.length - 1);
                  setCurrentProblemIndex(newIndex);
                }}
                onBlur={() => setIsEditingPuzzleNumber(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setIsEditingPuzzleNumber(false);
                  }
                }}
                autoFocus
              />
            ) : (
              <span 
                onDoubleClick={() => setIsEditingPuzzleNumber(true)}
                className="cursor-pointer hover:opacity-80"
                title="Double click to change puzzle number"
              >
                Chess Puzzle #{currentProblemIndex + 1}
                <p className="text-sm text-gray-500">{currentProblem.type}</p>
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center space-y-4">
            <ChessBoard
              fen={currentProblem.fen}
              moves={currentProblem.moves}
              onCorrectMove={() => {
                recordPuzzleAttempt(currentProblem.problemid, true);
              }}
              onIncorrectMove={() => {
                recordPuzzleAttempt(currentProblem.problemid, false);
              }}
              onPuzzleComplete={() => {
                markPuzzleComplete(currentProblem.problemid);
              }}
              onNextPuzzle={handleNextProblem}
            />
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={handlePreviousProblem}
                disabled={currentProblemIndex === 0}
              >
                Previous
              </Button>
              <div className="text-center">
                <p className="text-xl font-semibold">Current Streak: {stats.currentStreak}</p>
              </div>
              <Button
                variant="outline"
                onClick={handleNextProblem}
                disabled={currentProblemIndex === problems.length - 1}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
