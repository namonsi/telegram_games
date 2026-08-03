import { useState } from 'react';
import type { Room } from '../game/types';
import { api, inviteLink } from '../api';

type Props = {
  me: { id: string; firstName: string; photoUrl?: string };
  room?: Room;
  onCreated: (room: Room) => void;
  onJoin: (roomId: string) => void;
  joinError: string | null;
};

export default function Lobby({ me, room, onCreated, onJoin, joinError }: Props) {
  const [min, setMin] = useState(1);
  const [max, setMax] = useState(100);
  const [name, setName] = useState(me.firstName);
  const [joinId, setJoinId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (room) {
    const other = room.players.find((p) => p.id !== me.id);
    return (
      <div className="screen">
        <h1>Waiting for your partner</h1>
        <p className="muted">Share the invite so they can join your room.</p>
        <div className="card">
          <code className="link">{inviteLink(room.id)}</code>
        </div>
        <p className="muted">{other ? `Waiting for ${other.firstName}…` : 'No one here yet…'}</p>
      </div>
    );
  }

  const start = async () => {
    setBusy(true);
    setError(null);
    try {
      const created = await api.create({ min, max }, name.trim() || me.firstName);
      onCreated(created);
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  };

  return (
    <div className="screen">
      <h1>Guess the Number</h1>
      <p className="muted">Pick a secret number, your partner tries to find it.</p>
      <label>
        Your name
        <input value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <label>
        Range min
        <input type="number" value={min} onChange={(e) => setMin(Number(e.target.value))} />
      </label>
      <label>
        Range max
        <input type="number" value={max} onChange={(e) => setMax(Number(e.target.value))} />
      </label>
      {error && <p className="error">{error}</p>}
      {joinError && <p className="error">{joinError}</p>}
      <button onClick={start} disabled={busy}>
        {busy ? 'Creating…' : 'Create game'}
      </button>
      <div className="card">
        <p className="muted">Have a room link?</p>
        <div className="row">
          <input value={joinId} onChange={(e) => setJoinId(e.target.value)} placeholder="Room id" />
          <button className="secondary" onClick={() => onJoin(joinId.trim())} disabled={!joinId.trim()}>
            Join
          </button>
        </div>
      </div>
    </div>
  );
}
