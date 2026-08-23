import { useCallback, useEffect, useMemo, useState } from 'react';
import { initData } from '@tma.js/sdk';
import type { GameKind, Room } from './game/types';
import { api, type SurpriseKind } from './api';
import { useRoom } from './useRoom';
import Lobby from './ui/Lobby';
import Setup from './ui/Setup';
import GameBoard from './ui/GameBoard';
import Result from './ui/Result';
import KnowMe from './ui/KnowMe';
import Battleship from './ui/Battleship';
import TwentyQ from './ui/TwentyQ';
import Mystery from './ui/Mystery';
import QuizDuel from './ui/QuizDuel';
import SurpriseGate from './ui/SurpriseGate';

type Me = { id: string; firstName: string; photoUrl?: string; username?: string };

const KINDS: GameKind[] = ['number', 'knowme', 'battleship', 'twenty', 'mystery', 'quiz'];

export default function App({ me }: { me: Me }) {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const polled = useRoom(roomId);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [giftDone, setGiftDone] = useState(false);

  // polling refresh catches the partner's moves
  useEffect(() => {
    if (polled) setRoom(polled);
  }, [polled]);

  // invite links carry "~<surprise>" after the room id when a surprise was attached
  const [startRoomId, startGift] = useMemo(() => {
    const param = initData.startParam() ?? new URLSearchParams(window.location.search).get('startapp') ?? '';
    const [id, gift] = param.split('~');
    return [id || null, gift === 'note' || gift === 'gift' || gift === 'random' ? (gift as SurpriseKind) : null];
  }, []);

  const join = useCallback(
    async (id: string) => {
      if (!id) return;
      try {
        const joined = await api.join(id, me.firstName);
        setRoomId(joined.id);
        setRoom(joined);
        setJoinError(null);
      } catch (e) {
        setJoinError((e as Error).message);
      }
    },
    [me.firstName],
  );

  useEffect(() => {
    if (startRoomId && !roomId) void join(startRoomId);
  }, [startRoomId, roomId, join]);

  // ponytail: action results apply immediately; the next poll overwrites with fresher state
  const applyRoom = useCallback((next: Room) => setRoom(next), []);
  const enterRoom = useCallback((next: Room) => {
    setRoomId(next.id);
    setRoom(next);
  }, []);

  const screen = () => {
    if (!roomId) {
      return <Lobby me={me} onCreated={enterRoom} onJoin={join} joinError={joinError} />;
    }
    if (!room || !KINDS.includes(room.kind)) {
      return (
        <div className="screen">
          <h1>Game night 💞</h1>
          <p className="muted">Loading room…</p>
        </div>
      );
    }
    switch (room.status) {
      case 'waiting':
        return <Lobby me={me} room={room} onCreated={enterRoom} onJoin={join} joinError={joinError} />;
      case 'finished':
        // games with custom end screens handle finished themselves
        if (room.kind !== 'number') break;
        return <Result me={me} room={room} onUpdate={applyRoom} />;
    }
    switch (room.kind) {
      case 'number':
        return room.status === 'setup' ? (
          <Setup me={me} room={room} onUpdate={applyRoom} />
        ) : (
          <GameBoard me={me} room={room} onUpdate={applyRoom} />
        );
      case 'knowme':
        return <KnowMe meId={me.id} room={room} onUpdate={applyRoom} />;
      case 'battleship':
        return <Battleship meId={me.id} room={room} onUpdate={applyRoom} />;
      case 'twenty':
        return <TwentyQ meId={me.id} room={room} onUpdate={applyRoom} />;
      case 'mystery':
        return <Mystery meId={me.id} room={room} onUpdate={applyRoom} />;
      case 'quiz':
        return <QuizDuel meId={me.id} room={room} onUpdate={applyRoom} />;
    }
  };

  return (
    <>
      {screen()}
      {startGift && !giftDone && (
        <SurpriseGate
          kind={startGift}
          onDone={() => setGiftDone(true)}
        />
      )}
    </>
  );
}
