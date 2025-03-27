import { useState, useEffect } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { Button } from '@/components/ui/button';

interface ChessBoardProps {
  fen: string;
  moves: string;
  onCorrectMove: () => void;
  onIncorrectMove: () => void;
  onPuzzleComplete: () => void;
  onNextPuzzle: () => void;
}

export function ChessBoard({ fen, moves, onCorrectMove, onIncorrectMove, onPuzzleComplete, onNextPuzzle }: ChessBoardProps) {
  const [game, setGame] = useState(new Chess(fen));
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  const [isPuzzleComplete, setIsPuzzleComplete] = useState(false);

  // Reset the board when the puzzle changes
  useEffect(() => {
    setGame(new Chess(fen));
    setCurrentMoveIndex(0);
    setIsPuzzleComplete(false);
  }, [fen]);

  // Split moves by semicolon to get individual moves
  const currentPuzzleMoves = moves.split(';');

  console.log('All moves:', moves);
  console.log('Split moves:', currentPuzzleMoves);

  function makeMove(move: { from: string; to: string }) {
    if (isPuzzleComplete) return;

    try {
      const result = game.move({
        from: move.from,
        to: move.to,
        promotion: 'q', // Always promote to queen for simplicity
      });

      if (result) {
        setGame(new Chess(game.fen()));
        
        // Check if the move matches the expected move
        const expectedMove = currentPuzzleMoves[currentMoveIndex];
        const actualMove = `${move.from}-${move.to}`;

        console.log('actual move:', actualMove, 'expected move:', expectedMove);
        
        if (actualMove === expectedMove) {
          onCorrectMove();
          setCurrentMoveIndex(currentMoveIndex + 1);
          
          // If there are more moves in the sequence, make the opponent's move
          if (currentMoveIndex + 1 < currentPuzzleMoves.length) {
            const [from, to] = currentPuzzleMoves[currentMoveIndex + 1].split('-');
            setTimeout(() => {
              game.move({ from, to });
              setGame(new Chess(game.fen()));
              setCurrentMoveIndex(currentMoveIndex + 2);
            }, 500);
          } else {
            // If this was the last move, mark the puzzle as complete
            setIsPuzzleComplete(true);
            onPuzzleComplete();
          }
        } else {
          onIncorrectMove();
          // Reset the move
          setGame(new Chess(fen));
        }
      }
    } catch (error) {
      console.error('Invalid move:', error);
    }
  }

  function onDrop(sourceSquare: string, targetSquare: string) {
    makeMove({
      from: sourceSquare,
      to: targetSquare,
    });
    return true;
  }

  return (
    <div className="w-full max-w-[600px] mx-auto">
      <div className="relative">
        <Chessboard 
          position={game.fen()} 
          onPieceDrop={onDrop}
          boardWidth={600}
        />
        {isPuzzleComplete && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg shadow-lg text-center">
              <h2 className="text-xl font-bold mb-4">Puzzle Complete!</h2>
              <Button onClick={onNextPuzzle}>Next Puzzle</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
