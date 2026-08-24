import { useState } from 'react';
import type { NumberRoom } from '../game/types';
import { api } from '../api';
import SocialBar from './SocialBar';

type Props = {
  me: { id: string; firstName: string; photoUrl?: string };
  room: NumberRoom;
  onUpdate: (room: NumberRoom) => void;
};

export default function GameBoard({ me, room, onUpdate }: Props) {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const current = room.players.find((p) => p.id === room.turn);
  const myTurn = room.turn === me.id;
  const last = room.history[room.history.length - 1];
  const lastHint = last ? last.hint : null;
  const lastPlayer = last ? room.players.find((p) => p.id === last.playerId)?.firstName : null;

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const next = await api.guess(room.id, Number(value));
      onUpdate(next as NumberRoom);
      setValue('');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="screen">
      <h1>Guess the Number</h1>
      <p className="muted">
        Range {room.range.min}–{room.range.max} · Round {room.stats.games + 1}
      </p>

      <SocialBar room={room} onUpdate={onUpdate} />

      {lastHint && (
        <div className={`card hint-${lastHint}`}>
          {lastPlayer} guessed {last.value} — it was{' '}
          <b>{lastHint === 'hit' ? 'spot on!' : lastHint === 'higher' ? 'too low, go higher' : 'too high, go lower'}</b>
        </div>
      )}

      {myTurn ? (
        <div>
          <h2>Your turn</h2>
          <input
            type="number"
            value={value}
            min={room.range.min}
            max={room.range.max}
            onChange={(e) => setValue(e.target.value)}
            placeholder={`${room.range.min}–${room.range.max}`}
          />
          {error && <p className="error">{error}</p>}
          <button onClick={submit} disabled={busy}>
            {busy ? 'Guessing…' : 'Guess'}
          </button>
        </div>
      ) : (
        <p className="muted">Waiting for {current?.firstName ?? 'your partner'} to guess…</p>
      )}

      <h3>Guess history</h3>
      <ul className="history">
        {room.history.length === 0 && <li className="muted">No guesses yet</li>}
        {room.history.map((g, i) => (
          <li key={i}>
            {room.players.find((p) => p.id === g.playerId)?.firstName}: {g.value} →{' '}
            {g.hint === 'hit' ? 'hit' : g.hint === 'higher' ? 'higher' : 'lower'}
          </li>
        ))}
      </ul>
    </div>
  );
}
