import { Chess } from 'chess.js';

export interface MoveWithClock {
  san: string;        // Standard Algebraic Notation
  timeLeft: string;   // Clock time in h:mm:ss.s format
  timeSpent?: number; // Time spent in seconds (calculated)
  color: 'w' | 'b';   // White or black
  moveNumber: number; // The move number (e.g., 1, 2, 3...)
}

export interface ParsedChessGame {
  metadata: Record<string, string>;
  moves: MoveWithClock[];
}

/**
 * Parses a PGN string and extracts moves with timing information
 */
export function parsePgnWithTiming(pgn: string): ParsedChessGame {
  const chess = new Chess();
  
  try {
    // Extract metadata directly from PGN headers
    const headerRegex = /\[(\w+)\s+"(.+?)"\]/g;
    const metadata: Record<string, string> = {};
    let match;
    while ((match = headerRegex.exec(pgn)) !== null) {
      metadata[match[1]] = match[2];
    }
    
    try {
      // Try to load the PGN - this might fail with some malformed PGNs
      chess.loadPgn(pgn);
      
      // Extract the raw PGN comments which contain the clock information
      const clockRegex = /\{(?:\[%clk\s+([^\]]+)\])?[^}]*\}/g;
      const clockMatches = [...pgn.matchAll(clockRegex)];
      
      // Get the history of moves
      const history = chess.history({ verbose: true });
      
      const moves: MoveWithClock[] = [];
      let prevWhiteTime: number | null = null;
      let prevBlackTime: number | null = null;
      
      // Process each move
      for (let i = 0; i < history.length; i++) {
        const historyMove = history[i];
        const clockMatch = clockMatches[i]?.[1]; // Get clock info from regex match
        const color = historyMove.color as 'w' | 'b';
        const moveNumber = color === 'w' ? Math.ceil((i + 1) / 2) : Math.floor((i + 1) / 2);
        
        const clockTime = clockMatch || "";
        const timeInSeconds = convertClockToSeconds(clockTime);
        
        // Calculate time spent
        let timeSpent: number | undefined;
        if (color === 'w') {
          timeSpent = prevWhiteTime !== null ? prevWhiteTime - timeInSeconds : undefined;
          prevWhiteTime = timeInSeconds;
        } else {
          timeSpent = prevBlackTime !== null ? prevBlackTime - timeInSeconds : undefined;
          prevBlackTime = timeInSeconds;
        }
        
        moves.push({
          san: historyMove.san,
          timeLeft: clockTime,
          timeSpent,
          color,
          moveNumber
        });
      }
      
      return { metadata, moves };
    } catch (chessError) {
      // If chess.js fails to parse, fall back to regex parsing for moves
      console.error("Error parsing PGN with chess.js, falling back to regex:", chessError);
      
      const moves: MoveWithClock[] = [];
      let prevWhiteTime: number | null = null;
      let prevBlackTime: number | null = null;
      
      // Basic regex to extract moves and clock info
      // Format: 1. e4 {[%clk 0:15:00]} 1... e5 {[%clk 0:15:00]}
      const moveRegex = /(\d+)\.\s+([\w\+\#\=\-\!\?]+)\s+\{(?:\[%clk\s+([^\]]+)\])?[^}]*\}(?:\s+(?:\d+\.{3}\s+)?([\w\+\#\=\-\!\?]+)\s+\{(?:\[%clk\s+([^\]]+)\])?[^}]*\})?/g;
      
      while ((match = moveRegex.exec(pgn)) !== null) {
        const moveNumber = parseInt(match[1], 10);
        const whiteSan = match[2];
        const whiteClockTime = match[3] || "";
        
        const whiteTimeInSeconds = convertClockToSeconds(whiteClockTime);
        const whiteTimeSpent = prevWhiteTime !== null ? prevWhiteTime - whiteTimeInSeconds : undefined;
        prevWhiteTime = whiteTimeInSeconds;
        
        moves.push({
          san: whiteSan,
          timeLeft: whiteClockTime,
          timeSpent: whiteTimeSpent,
          color: 'w',
          moveNumber
        });
        
        // Check if there's a black move
        if (match[4]) {
          const blackSan = match[4];
          const blackClockTime = match[5] || "";
          
          const blackTimeInSeconds = convertClockToSeconds(blackClockTime);
          const blackTimeSpent = prevBlackTime !== null ? prevBlackTime - blackTimeInSeconds : undefined;
          prevBlackTime = blackTimeInSeconds;
          
          moves.push({
            san: blackSan,
            timeLeft: blackClockTime,
            timeSpent: blackTimeSpent,
            color: 'b',
            moveNumber
          });
        }
      }
      
      return { metadata, moves };
    }
    
    // The empty moves array is already returned by the inner try-catch
    // This code should not be reached, but we include it for completeness
    const moves: MoveWithClock[] = [];
    return {
      metadata,
      moves
    };
  } catch (error) {
    console.error("Error parsing PGN:", error);
    // Return empty moves to avoid crashing the sync process
    return {
      metadata: {},
      moves: []
    };
  }
}

/**
 * Converts a clock time string (h:mm:ss.s) to seconds
 */
function convertClockToSeconds(timeStr: string): number {
  if (!timeStr) return 0;
  const [hours, minutes, seconds] = timeStr.split(':').map(parseFloat);
  return hours * 3600 + minutes * 60 + seconds;
}
