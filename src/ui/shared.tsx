import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import type { Room } from '../game/types';
import { api, inviteLink } from '../api';

export function PartnerWait({ room }: { room: Room }) {
  const copy = () => navigator.clipboard.writeText(inviteLink(room.id)).catch(() => {});
  return (
    <div className="card">
      <p className="muted">Invite your partner so the game can start:</p>
      <code className="link">{inviteLink(room.id)}</code>
      <button className="secondary" onClick={copy}>
        Copy invite
      </button>
    </div>
  );
}

export function useWinConfetti(key: string) {
  useEffect(() => {
    confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
    const timer = setTimeout(() => confetti({ particleCount: 80, spread: 100, origin: { y: 0.4 } }), 400);
    return () => clearTimeout(timer);
  }, [key]);
}

export function useConfettiWhen(active: boolean, key: string) {
  useEffect(() => {
    if (!active) return;
    confetti({ particleCount: 140, spread: 90, origin: { y: 0.5 } });
    const timer = setTimeout(() => confetti({ particleCount: 90, spread: 110, origin: { y: 0.35 } }), 450);
    return () => clearTimeout(timer);
  }, [active, key]);
}

export type GameOverProps<T extends Room> = {
  room: T;
  meId: string;
  onUpdate: (room: T) => void;
  emoji: string;
  headline: string;
};

/** standard finished-state block: trophy/tie art, score row, rematch */
export function GameOver<T extends Room>({ room, meId, onUpdate, emoji, headline }: GameOverProps<T>) {
  const other = room.players.find((p) => p.id !== meId);
  const isTeam = room.winner === 'team';
  const draw = room.winner === null;

  const rematch = async () => onUpdate((await api.rematch(room.id)) as T);

  return (
    <div className="screen result">
      <div className="trophy">{emoji}</div>
      <h1>{headline}</h1>
      {!isTeam && (
        <div className="card">
          <div className="stat">
            <span>You</span>
            <b>{room.stats.wins[meId] ?? 0}</b>
          </div>
          <div className="stat">
            <span>{other?.firstName ?? 'Partner'}</span>
            <b>{other ? (room.stats.wins[other.id] ?? 0) : 0}</b>
          </div>
        </div>
      )}
      {isTeam && (
        <p className="muted">Cases solved together: {room.stats.solved ?? 0} 🕵️</p>
      )}
      <button onClick={rematch}>{draw ? 'Try again' : 'Rematch'}</button>
      <button className="secondary" onClick={() => window.location.reload()}>
        New game
      </button>
    </div>
  );
}
