import { createRoom } from '../game/engine';
import type { Room } from '../game/types';
import { loadStreak, newId, saveRoom } from '../store';

type Props = {
  room: Room;
  onRematch: (room: Room) => void;
  onNewGame: () => void;
};

export default function Result({ room, onRematch, onNewGame }: Props) {
  const winner = room.players.find((p) => p.id === room.winner)!;
  const streak = loadStreak(room.id);

  const rematch = () => {
    const next = createRoom(newId(), room.range, [
      { ...room.players[0], id: 'p0' },
      { ...room.players[1], id: 'p1' },
    ]);
    saveRoom(next);
    onRematch(next);
  };

  return (
    <div className="screen">
      <h1>{winner.firstName} wins!</h1>
      <div className="card">
        {room.players.map((p) => (
          <p key={p.id}>
            {p.firstName}: {streak[p.id] ?? 0} win{(streak[p.id] ?? 0) === 1 ? '' : 's'}
          </p>
        ))}
      </div>
      <button onClick={rematch}>Rematch</button>
      <button className="secondary" onClick={onNewGame}>
        New game
      </button>
    </div>
  );
}
