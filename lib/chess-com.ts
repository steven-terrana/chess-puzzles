interface ChessComGame {
  url: string;
  pgn: string;
  time_control: string;
  time_class: string; // 'bullet', 'blitz', 'rapid', 'daily'...
  rated: boolean;
  end_time: number;
  white: { username: string; result: string };
  black: { username: string; result: string };
}

interface ChessComArchive {
  games: ChessComGame[];
}

export async function getPlayerArchives(username: string): Promise<string[]> {
  const response = await fetch(
    `https://api.chess.com/pub/player/${username}/games/archives`
  );
  if (!response.ok) throw new Error(`Failed to fetch archives for ${username}`);
  const data = await response.json();
  return data.archives;
}

export async function getGamesFromArchive(
  archiveUrl: string
): Promise<ChessComGame[]> {
  const response = await fetch(archiveUrl);
  if (!response.ok)
    throw new Error(`Failed to fetch games from archive ${archiveUrl}`);
  const data: ChessComArchive = await response.json();
  return data.games;
}

export function determineWinner(game: ChessComGame): string | null {
  if (game.white.result === "win") return "white";
  if (game.black.result === "win") return "black";
  return null;
}
