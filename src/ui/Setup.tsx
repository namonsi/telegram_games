import { useState } from 'react';
import type { NumberRoom } from '../game/types';
import { api, inviteLink } from '../api';

type Props = {
  me: { id: string; firstName: string; photoUrl?: string };
  room: NumberRoom;
  onUpdate: (room: NumberRoom) => void;
};

export default function Setup({ me, room, onUpdate }: Props) {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const meInRoom = room.players.find((p) => p.id === me.id);
  const other = room.players.find((p) => p.id !== me.id);
  const mySet = room.targets[me.id] !== undefined;
  const bothSet = room.players.length === 2 && room.players.every((p) => room.targets[p.id] !== undefined);

  if (bothSet) {
    return (
      <div className="screen">
        <h1>Set your secret number</h1>
        <p className="muted">Starting the round...</p>
      </div>
    );
  }

  const commit = async () => {
    setBusy(true);
    setError(null);
    try {
      const next = await api.setTarget(room.id, Number(value));
      onUpdate(next as NumberRoom);
      setValue('');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const copyInvite = () => {
    navigator.clipboard.writeText(inviteLink(room.id)).catch(() => {});
  };

  return (
    <div className="screen">
      <h1>Set your secret number</h1>
      <p className="muted">
        {meInRoom?.firstName ?? me.firstName}, pick a number from {room.range.min} to {room.range.max}. It stays hidden
        from {other?.firstName ?? 'your partner'}.
      </p>
      {!other && (
        <div className="card">
          <p className="muted">Invite your partner:</p>
          <code className="link">{inviteLink(room.id)}</code>
          <button className="secondary" onClick={copyInvite}>
            Copy invite
          </button>
        </div>
      )}
      {mySet ? (
        <p className="muted">Waiting for {other?.firstName ?? 'your partner'} to set their number…</p>
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
          {error && <p className="error">{error}</p>}
          <button onClick={commit} disabled={busy}>
            {busy ? 'Locking…' : 'Lock in secret number'}
          </button>
        </div>
      )}
    </div>
  );
}
