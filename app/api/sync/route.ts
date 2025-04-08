import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  getPlayerArchives,
  getGamesFromArchive,
  determineWinner,
} from "@/lib/chess-com";
import { parsePgnWithTiming } from "@/lib/pgn-parser";

export async function POST(request: Request) {
  try {
    const { username } = await request.json();
    if (!username) {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      );
    }

    // Get or create player
    let player = await prisma.player.findUnique({ where: { username } });
    if (!player) {
      player = await prisma.player.create({ data: { id: username, username } });
    }

    // Get all archives
    const archives = await getPlayerArchives(username);
    let totalGames = 0;

    // Process each archive
    for (const archiveUrl of archives) {
      const games = await getGamesFromArchive(archiveUrl);

      for (const game of games) {
        // Check if game already exists
        const existingGame = await prisma.game.findUnique({
          where: { id: game.url },
          include: { moves: true }
        });
        
        // Create both players if they don't exist
        await prisma.player.upsert({
          where: { username: game.white.username },
          create: { id: game.white.username, username: game.white.username },
          update: {},
        });
        await prisma.player.upsert({
          where: { username: game.black.username },
          create: { id: game.black.username, username: game.black.username },
          update: {},
        });

        // Parse the PGN to extract moves with timing information
        const parsedGame = parsePgnWithTiming(game.pgn);
        
        if (existingGame) {
          // If the game exists, update it with gameMode and add moves if needed
          const updates: { gameMode?: string, moves?: any } = {};
          
          // Add gameMode if it's missing
          if (!existingGame.gameMode) {
            updates.gameMode = game.time_class;
          }
          
          // If the game has no moves, add them
          if (existingGame.moves.length === 0) {
            // We'll add moves separately using createMany for better performance
            await prisma.move.createMany({
              data: parsedGame.moves.map(move => ({
                gameId: game.url,
                moveNumber: move.moveNumber,
                san: move.san,
                color: move.color,
                timeLeft: move.timeLeft,
                timeSpent: move.timeSpent,
              }))
            });
          }
          
          // If we need to update the game record
          if (updates.gameMode) {
            await prisma.game.update({
              where: { id: game.url },
              data: { gameMode: updates.gameMode }
            });
          }
          
          totalGames++;
        } else {
          // Create new game with moves
          await prisma.game.create({
            data: {
              id: game.url,
              timeControl: game.time_control,
              gameMode: game.time_class, // Use the time_class field directly
              rated: game.rated,
              status: game.white.result,
              winner: determineWinner(game),
              whiteId: game.white.username,
              blackId: game.black.username,
              pgn: game.pgn,
              endTime: new Date(game.end_time * 1000),
              moves: {
                create: parsedGame.moves.map(move => ({
                  moveNumber: move.moveNumber,
                  san: move.san,
                  color: move.color,
                  timeLeft: move.timeLeft,
                  timeSpent: move.timeSpent,
                }))
              }
            },
          });
          totalGames++;
        }
      }
    }

    // Update last sync time
    await prisma.player.update({
      where: { username },
      data: { lastSyncTime: new Date() },
    });

    return NextResponse.json({
      message: `Successfully synced ${totalGames} new games for ${username}`,
      totalGames,
    });
  } catch (error) {
    console.error("Error syncing games:", error);
    return NextResponse.json(
      { 
        error: "Failed to sync games", 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
