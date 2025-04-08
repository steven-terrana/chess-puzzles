import { NextResponse } from "next/server";

export interface ChessStats {
  gameMode: "rapid" | "blitz" | "bullet";
  rating: number;
  wins: number;
  losses: number;
  draws: number;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const gameMode =
    (searchParams.get("gameMode") as ChessStats["gameMode"]) || "rapid";

  // TODO: Replace with actual chess.com API integration
  const mockStats: ChessStats = {
    gameMode,
    rating: 1200,
    wins: 10,
    losses: 5,
    draws: 3,
  };

  return NextResponse.json(mockStats);
}
