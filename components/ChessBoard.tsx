import { useState, useEffect } from 'react';
import { Chess, Square } from 'chess.js';
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
  const [showError, setShowError] = useState(false);
  const [pendingMove, setPendingMove] = useState<{ from: string; to: string } | null>(null);

  // Reset the board when the puzzle changes
  useEffect(() => {
    resetPuzzle();
  }, [fen]);

  const resetPuzzle = () => {
    setGame(new Chess(fen));
    setCurrentMoveIndex(0);
    setIsPuzzleComplete(false);
    setShowError(false);
    setPendingMove(null);
  };

  // Split moves by semicolon to get individual moves
  const currentPuzzleMoves = moves.split(';');

  function makeMove(move: { from: string; to: string }, promotionPiece?: string) {
    if (isPuzzleComplete) return;

    try {
      const result = game.move({
        from: move.from,
        to: move.to,
        promotion: promotionPiece,
      });

      if (result) {
        setGame(new Chess(game.fen()));
        
        // Check if the move matches the expected move
        const expectedMove = currentPuzzleMoves[currentMoveIndex];
        const actualMove = `${move.from}-${move.to}${promotionPiece ? promotionPiece : ''}`;

        console.log('expected:', expectedMove, 'actual:', actualMove)

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
          setShowError(true);
          // Reset the move
          setGame(new Chess(fen));
        }
      }
    } catch (error) {
      console.error('Invalid move:', error);
    }
  }

  function onDrop(sourceSquare: Square, targetSquare: Square, piece: string) {
    console.log('on drop:', sourceSquare, targetSquare, piece)

    const previous_piece = game.get(sourceSquare);
    const piece_type = piece.charAt(1).toLowerCase();
    const isPromotion = previous_piece?.type == 'p' && piece_type != 'p';

    // Make the move immediately if it's not a promotion
    if (isPromotion){
      makeMove({ from: sourceSquare, to: targetSquare}, piece_type);
    } else {
      makeMove({ from: sourceSquare, to: targetSquare});
    }

    return true;
  }

  return (
    <div className="w-full max-w-[600px] mx-auto">
      <div className="relative">
        <Chessboard 
          position={game.fen()} 
          onPieceDrop={onDrop}
          boardWidth={600}
          customBoardStyle={{
            borderRadius: '4px',
            boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)'
          }}
          customDarkSquareStyle={{ backgroundColor: '#B58863' }}
          customLightSquareStyle={{ backgroundColor: '#F0D9B5' }}
        />
        {isPuzzleComplete && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg shadow-lg text-center">
              <h2 className="text-xl font-bold mb-4">Puzzle Complete! 🎉</h2>
              <Button onClick={onNextPuzzle}>Next Puzzle</Button>
            </div>
          </div>
        )}
        {showError && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg shadow-lg text-center">
              <h2 className="text-xl font-bold mb-4">Incorrect Move</h2>
              <Button onClick={() => setShowError(false)}>Try Again</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
