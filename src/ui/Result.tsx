import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import type { Room } from '../game/types';
import { api } from '../api';

type Props = {
  me: { id: string; firstName: string; photoUrl?: string };
  room: Room;
  onUpdate: (room: Room) => void;
};

export default function Result({ me, room, onUpdate }: Props) {
  const winner = room.players.find((p) => p.id === room.winner);
  const iWon = winner?.id === me.id;
  const myWins = room.stats.wins[me.id] ?? 0;
  const other = room.players.find((p) => p.id !== me.id);
  const otherWins = other ? (room.stats.wins[other.id] ?? 0) : 0;

  useEffect(() => {
    confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
    const timer = setTimeout(() => confetti({ particleCount: 80, spread: 100, origin: { y: 0.4 } }), 400);
    return () => clearTimeout(timer);
  }, [room.id]);

  const rematch = async () => {
    const next = await api.rematch(room.id);
    onUpdate(next);
  };

  return (
    <div className="screen result">
      <div className="trophy">{iWon ? '🏆' : '💙'}</div>
      <h1>{iWon ? 'You win!' : `${winner?.firstName ?? 'Partner'} wins!`}</h1>
      <p className="muted">{iWon ? 'You found the number. Nicely done.' : 'Close one. Rematch?'}</p>
      <div className="card">
        <div className="stat">
          <span>You</span>
          <b>{myWins}</b>
        </div>
        <div className="stat">
          <span>{other?.firstName ?? 'Partner'}</span>
          <b>{otherWins}</b>
        </div>
      </div>
      <button onClick={rematch}>Rematch</button>
      <button className="secondary" onClick={() => window.location.reload()}>
        New game
      </button>
    </div>
  );
}
