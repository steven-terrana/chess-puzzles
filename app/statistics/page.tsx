'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

type GameMode = 'rapid' | 'blitz' | 'bullet';

export default function Statistics() {
  const [gameMode, setGameMode] = useState<GameMode>('rapid');

  return (
    <div className="p-8">
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Chess.com Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Game Mode</label>
            <ToggleGroup type="single" value={gameMode} onValueChange={(value) => value && setGameMode(value as GameMode)}>
              <ToggleGroupItem value="rapid">Rapid</ToggleGroupItem>
              <ToggleGroupItem value="blitz">Blitz</ToggleGroupItem>
              <ToggleGroupItem value="bullet">Bullet</ToggleGroupItem>
            </ToggleGroup>
          </div>
          <div>coming soon...</div>
          <div>{gameMode}</div>
        </CardContent>
      </Card>
    </div>
  );
}
