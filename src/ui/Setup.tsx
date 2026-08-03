import { useState } from 'react';
import { isReady, setTarget } from '../game/engine';
import type { Room } from '../game/types';
import { saveRoom } from '../store';

type Props = {
  room: Room;
  slot: 'p0' | 'p1';
  onReady: (room: Room) => void;
  onUpdate: (room: Room) => void;
};

export default function Setup({ room, slot, onReady, onUpdate }: Props) {
  const [value, setValue] = useState('');
  const me = room.players.find((p) => p.id === slot)!;
  const other = room.players.find((p) => p.id !== slot)!;
  const mySet = room.targets[slot] !== undefined;
  const bothSet = isReady(room);

  if (bothSet) return null;

  const commit = () => {
    try {
      const next = setTarget(room, slot, Number(value));
      saveRoom(next);
      onUpdate(next);
      if (isReady(next)) onReady(next);
      setValue('');
    } catch (e) {
      alert((e as Error).message);
    }
  };

  return (
    <div className="screen">
      <h1>Set your secret number</h1>
      <p className="muted">
        {me.firstName}, pick a number from {room.range.min} to {room.range.max}. It stays hidden
        from {other.firstName}.
      </p>
      {slot === 'p0' && !mySet && (
        <div className="card">
          <p className="muted">Invite your partner:</p>
          <code className="link">{window.location.origin}?startapp={room.id}</code>
        </div>
      )}
      {mySet ? (
        <p className="muted">Waiting for {other.firstName} to set their number…</p>
      ) : (
        <div>
          <input
            type="number"
            value={value}
            min={room.range.min}
            max={room.range.max}
            onChange={(e) => setValue(e.target.value)}
            placeholder={`${room.range.min}–${room.range.max}`}
          />
          <button onClick={commit}>Lock in secret number</button>
        </div>
      )}
    </div>
  );
}
