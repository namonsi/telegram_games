import { useCallback, useEffect, useMemo, useState } from 'react';
import { initData } from '@tma.js/sdk';
import type { Room } from './game/types';
import { api } from './api';
import { useRoom } from './useRoom';
import Lobby from './ui/Lobby';
import Setup from './ui/Setup';
import GameBoard from './ui/GameBoard';
import Result from './ui/Result';

type Props = { me: { id: string; firstName: string; photoUrl?: string } };

export default function App({ me }: Props) {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const polled = useRoom(roomId);
  const [joinError, setJoinError] = useState<string | null>(null);

  // polling refresh catches the partner's moves
  useEffect(() => {
    if (polled) setRoom(polled);
  }, [polled]);

  const startParam = useMemo(
    () => initData.startParam() ?? new URLSearchParams(window.location.search).get('startapp') ?? undefined,
    [],
  );

  const join = useCallback(async (id: string) => {
    try {
      const joined = await api.join(id, me.firstName);
      setRoomId(joined.id);
      setRoom(joined);
      setJoinError(null);
    } catch (e) {
      setJoinError((e as Error).message);
    }
  }, [me.firstName]);

  useEffect(() => {
    if (startParam && !roomId) void join(startParam);
  }, [startParam, roomId, join]);

  // ponytail: action results apply immediately; the next poll overwrites with fresher state
  const applyRoom = useCallback((next: Room) => setRoom(next), []);
  const enterRoom = useCallback((next: Room) => {
    setRoomId(next.id);
    setRoom(next);
  }, []);

  if (!roomId) {
    return <Lobby me={me} onCreated={enterRoom} onJoin={join} joinError={joinError} />;
  }

  if (!room) {
    return (
      <div className="screen">
        <h1>Guess the Number</h1>
        <p className="muted">Loading room...</p>
      </div>
    );
  }

  switch (room.status) {
    case 'waiting':
      return <Lobby me={me} room={room} onCreated={applyRoom} onJoin={join} joinError={joinError} />;
    case 'setup':
      return <Setup me={me} room={room} onUpdate={applyRoom} />;
    case 'playing':
      return <GameBoard me={me} room={room} onUpdate={applyRoom} />;
    case 'finished':
      return <Result me={me} room={room} onUpdate={applyRoom} />;
  }
}
