import { useState } from 'react';
import { createRoom } from '../game/engine';
import type { Room } from '../game/types';
import { newId, saveRoom } from '../store';

type Props = { onCreate: (room: Room) => void };

export default function Lobby({ onCreate }: Props) {
  const [min, setMin] = useState(1);
  const [max, setMax] = useState(100);
  const [p0Name, setP0Name] = useState('Player 1');

  const start = () => {
    const room = createRoom(newId(), { min, max }, [
      { id: 'p0', firstName: p0Name.trim() || 'Player 1' },
      { id: 'p1', firstName: 'Player 2' },
    ]);
    saveRoom(room);
    onCreate(room);
  };

  return (
    <div className="screen">
      <h1>Guess the Number</h1>
      <label>
        Your name
        <input value={p0Name} onChange={(e) => setP0Name(e.target.value)} />
      </label>
      <label>
        Range min
        <input type="number" value={min} onChange={(e) => setMin(Number(e.target.value))} />
      </label>
      <label>
        Range max
        <input type="number" value={max} onChange={(e) => setMax(Number(e.target.value))} />
      </label>
      <button onClick={start}>Create game</button>
    </div>
  );
}
