import { useCallback, useEffect, useMemo, useState } from 'react';
import { initData } from '@tma.js/sdk';
import type { Room } from './game/types';
import { isReady } from './game/engine';
import { loadRoom } from './store';
import Lobby from './ui/Lobby';
import Setup from './ui/Setup';
import GameBoard from './ui/GameBoard';
import Result from './ui/Result';

type Screen =
  | { name: 'lobby' }
  | { name: 'setup'; room: Room; slot: 'p0' | 'p1' }
  | { name: 'board'; room: Room }
  | { name: 'result'; room: Room };

const derive = (room: Room): Screen => {
  if (room.winner) return { name: 'result', room };
  if (isReady(room)) return { name: 'board', room };
  if (room.targets.p0 === undefined) return { name: 'setup', room, slot: 'p0' };
  return { name: 'setup', room, slot: 'p1' };
};

const refresh = (room: Room, prev: Screen): Screen => {
  if (room.winner) return { name: 'result', room };
  if (isReady(room)) return { name: 'board', room };
  if (prev.name === 'setup') return { name: 'setup', room, slot: prev.slot };
  return derive(room);
};

export default function App() {
  const [screen, setScreen] = useState<Screen>({ name: 'lobby' });

  const startParam = useMemo(
    () => initData.startParam() ?? new URLSearchParams(window.location.search).get('startapp') ?? undefined,
    [],
  );
  useEffect(() => {
    if (!startParam) return;
    const room = loadRoom(startParam);
    if (room) setScreen(derive(room));
  }, [startParam]);

  const applyRoom = useCallback(
    (room: Room) => {
      if (screen.name === 'lobby') return;
      setScreen(refresh(room, screen));
    },
    [screen],
  );

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== 'gtn:rooms' || screen.name === 'lobby') return;
      const room = loadRoom(screen.room.id);
      if (room) setScreen(refresh(room, screen));
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [screen]);

  switch (screen.name) {
    case 'lobby':
      return <Lobby onCreate={(room) => setScreen(derive(room))} />;
    case 'setup':
      return (
        <Setup
          room={screen.room}
          slot={screen.slot}
          onReady={(room) => setScreen(derive(room))}
          onUpdate={applyRoom}
        />
      );
    case 'board':
      return (
        <GameBoard
          room={screen.room}
          onFinish={(room) => setScreen({ name: 'result', room })}
          onUpdate={applyRoom}
        />
      );
    case 'result':
      return (
        <Result
          room={screen.room}
          onRematch={(room) => setScreen(derive(room))}
          onNewGame={() => setScreen({ name: 'lobby' })}
        />
      );
  }
}
