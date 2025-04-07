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
  const [highlightedSquares, setHighlightedSquares] = useState<{ [square: string]: { backgroundColor: string } }>({});
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [legalMoves, setLegalMoves] = useState<{ [square: string]: { background: string } }>({});

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
    setHighlightedSquares({});
    setSelectedSquare(null);
    setLegalMoves({});
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
          // Reset the move and move index
          setGame(new Chess(fen));
          setCurrentMoveIndex(0);
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

  function onSquareRightClick(square: Square) {
    const newHighlightedSquares = { ...highlightedSquares };
    if (newHighlightedSquares[square]) {
      delete newHighlightedSquares[square];
    } else {
      newHighlightedSquares[square] = { backgroundColor: "rgba(255, 0, 0, 0.4)" };
    }
    setHighlightedSquares(newHighlightedSquares);
  }

  function onSquareClick(square: Square) {
    // If a piece is already selected
    if (selectedSquare) {
      // If clicking the same square, deselect it
      if (square === selectedSquare) {
        setSelectedSquare(null);
        setLegalMoves({});
        return;
      }
      
      // If clicking a legal move square, make the move
      const moves = game.moves({ square: selectedSquare, verbose: true });
      const isLegalMove = moves.some(move => move.to === square);
      if (isLegalMove) {
        onDrop(selectedSquare, square, '');
        setSelectedSquare(null);
        setLegalMoves({});
        return;
      }
    }

    // Check if the clicked square has a piece that can move
    const piece = game.get(square);
    if (piece && piece.color === game.turn()) {
      setSelectedSquare(square);
      const moves = game.moves({ square, verbose: true });
      const newLegalMoves: { [square: string]: { background: string } } = {};
      moves.forEach(move => {
        newLegalMoves[move.to] = {
          background: 'radial-gradient(circle, rgba(128,128,128,.35) 20%, transparent 20%)'
        };
      });
      setLegalMoves(newLegalMoves);
    } else {
      setSelectedSquare(null);
      setLegalMoves({});
    }
  }

  return (
    <div className="w-full max-w-[600px] mx-auto">
      <div className="relative">
        <Chessboard 
          position={game.fen()} 
          onPieceDrop={onDrop}
          onSquareRightClick={onSquareRightClick}
          onSquareClick={onSquareClick}
          customSquareStyles={{
            ...highlightedSquares,
            ...legalMoves,
            ...(selectedSquare ? { [selectedSquare]: { backgroundColor: 'rgba(255, 255, 0, 0.4)' } } : {})
          }}
          boardWidth={600}
          customDarkSquareStyle={{ backgroundColor: '#769656' }}
          customLightSquareStyle={{ backgroundColor: '#eeeed2' }}
          customBoardStyle={{
            borderRadius: '4px',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.5)'
          }}
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
