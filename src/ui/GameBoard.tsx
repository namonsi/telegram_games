import { useState } from 'react';
import { guess } from '../game/engine';
import type { Room } from '../game/types';
import { addWin, saveRoom } from '../store';

type Props = {
  room: Room;
  onFinish: (room: Room) => void;
  onUpdate: (room: Room) => void;
};

export default function GameBoard({ room, onFinish, onUpdate }: Props) {
  const [value, setValue] = useState('');
  const current = room.players.find((p) => p.id === room.turn)!;
  const last = room.history[room.history.length - 1];
  const lastHint = last ? last.hint : null;
  const lastPlayer = last ? room.players.find((p) => p.id === last.playerId)!.firstName : null;

  const submit = () => {
    try {
      const { room: next } = guess(room, room.turn, Number(value));
      saveRoom(next);
      onUpdate(next);
      setValue('');
      if (next.winner) {
        addWin(next.id, next.winner);
        onFinish(next);
      }
    } catch (e) {
      alert((e as Error).message);
    }
  };

  return (
    <div className="screen">
      <h1>Guess the Number</h1>
      <p className="muted">
        Range {room.range.min}–{room.range.max}
      </p>
      {lastHint && (
        <div className={`card hint-${lastHint}`}>
          {lastPlayer} guessed {last.value} — it was <b>{lastHint === 'hit' ? 'spot on!' : lastHint === 'higher' ? 'too low, go higher' : 'too high, go lower'}</b>
        </div>
      )}
      <h2>{current.firstName}, your turn</h2>
      <input
        type="number"
        value={value}
        min={room.range.min}
        max={room.range.max}
        onChange={(e) => setValue(e.target.value)}
        placeholder={`${room.range.min}–${room.range.max}`}
      />
      <button onClick={submit}>Guess</button>

      <h3>Guess history</h3>
      <ul className="history">
        {room.history.length === 0 && <li className="muted">No guesses yet</li>}
        {room.history.map((g, i) => (
          <li key={i}>
            {room.players.find((p) => p.id === g.playerId)!.firstName}: {g.value} →{' '}
            {g.hint === 'hit' ? 'hit' : g.hint === 'higher' ? 'higher' : 'lower'}
          </li>
        ))}
      </ul>
    </div>
  );
}
