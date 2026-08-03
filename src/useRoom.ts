import { useEffect, useState } from 'react';
import type { Room } from './game/types';
import { fetchRoom } from './api';

// ponytail: fixed 2s polling instead of websockets; fine for a 2-player turn game.
export function useRoom(roomId: string | null): Room | null {
  const [room, setRoom] = useState<Room | null>(null);

  useEffect(() => {
    if (!roomId) {
      setRoom(null);
      return;
    }
    let alive = true;
    const tick = async () => {
      try {
        const next = await fetchRoom(roomId);
        if (alive) setRoom(next);
      } catch {
        // network blip; next poll retries
      }
    };
    void tick();
    const id = setInterval(tick, 2000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [roomId]);

  return room;
}
