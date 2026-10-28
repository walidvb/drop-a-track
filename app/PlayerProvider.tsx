"use client";

import { createContext, useContext, type ReactNode } from "react";
import { MediaEngine, usePlayQueue, type PlayQueue } from "@cucu/media/react";
import type { HomeTrack } from "@/lib/home";
import { refreshDropStream } from "@/lib/streams";

const Player = createContext<PlayQueue<HomeTrack> | null>(null);

/**
 * The one player, in the root layout: it outlives navigation between pages (home, All bags, a
 * bag's page), so what's playing keeps playing. Pages draw its controls from `usePlayer()`.
 */
export function PlayerProvider({ children }: { children: ReactNode }) {
  const player = usePlayQueue<HomeTrack>({ refreshStream: (t) => refreshDropStream(t.id) });
  return (
    <Player.Provider value={player}>
      {children}
      {/* Mounted as soon as something is cued, paused: the provider is loaded before the first tap (iOS only plays inside a gesture). */}
      {player.now && <MediaEngine {...player.engineProps} />}
    </Player.Provider>
  );
}

export function usePlayer() {
  const player = useContext(Player);
  if (!player) throw new Error("usePlayer() outside PlayerProvider");
  return player;
}
