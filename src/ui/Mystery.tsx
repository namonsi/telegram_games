import { useState } from 'react';
import type { MysteryRoom } from '../game/types';
import { api } from '../api';
import { MAX_STRIKES } from '../game/mystery';
import { PartnerWait, useConfettiWhen } from './shared';
import SocialBar from './SocialBar';

type Props = {
  meId: string;
  room: MysteryRoom;
  onUpdate: (room: MysteryRoom) => void;
};

export default function Mystery({ meId, room, onUpdate }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [pick, setPick] = useState<string | null>(null);
  const [accusing, setAccusing] = useState(false);

  const solved = room.status === 'finished' && room.winner === 'team';
  useConfettiWhen(solved, room.id);

  if (room.status === 'waiting') return <PartnerWait room={room} />;

  const other = room.players.find((p) => p.id !== meId);
  const myTurn = room.turn === meId;
  const cold = room.status === 'finished' && room.winner === null;

  const investigate = async () => {
    setBusy(true);
    setError(null);
    try {
      onUpdate(await api.investigate(room.id));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const accuse = async () => {
    if (!pick) return;
    setBusy(true);
    setError(null);
    try {
      onUpdate(await api.accuse(room.id, pick));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
      setAccusing(false);
    }
  };

  return (
    <div className="screen">
      <h1>🕵️ {room.title}</h1>
      <div className="card">
        <p className="muted">{room.story}</p>
      </div>

      {room.status === 'playing' && <SocialBar room={room} onUpdate={onUpdate} />}

      <h3>
        Clues {room.shown.length}/{room.clueCount} · Strikes {room.strikes}/{MAX_STRIKES}
      </h3>

      <ul className="history">
        {room.shown.map((clue, i) => (
          <li key={i}>
            🔎 <b>Clue {i + 1}:</b> {clue}
          </li>
        ))}
        {room.shown.length === 0 && <li className="muted">No clues yet — start investigating!</li>}
      </ul>

      {error && <p className="error">{error}</p>}

      {cold && (
        <div className="card">
          <h2>Case gone cold 💔</h2>
          <p className="muted">Three strikes. The culprit walked free… this time.</p>
          {room.solution && (
            <p className="muted">
              <b>Solution:</b> {room.solution}
            </p>
          )}
        </div>
      )}
      {solved && (
        <div className="card">
          <h2>Solved together! 🎉</h2>
          {room.solution && <p className="muted">{room.solution}</p>}
        </div>
      )}

      {room.status === 'playing' && !accusing && (
        <button onClick={investigate} disabled={busy || !myTurn}>
          {myTurn
            ? room.shown.length >= room.clueCount
              ? 'All clues found — accuse below'
              : '🔍 Investigate next clue'
            : `Waiting for ${other?.firstName ?? 'partner'}…`}
        </button>
      )}

      {room.status === 'playing' &&
        (accusing ? (
          <>
            <h3>Point the finger</h3>
            <ul className="history">
              {room.suspects.map((s) => (
                <li key={s.id}>
                  <label className={`suspect ${pick === s.id ? 'picked' : ''}`}>
                    <input type="radio" name="suspect" checked={pick === s.id} onChange={() => setPick(s.id)} />
                    <span>
                      <b>{s.name}</b>
                      <br />
                      <span className="muted">{s.blurb}</span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
            <button onClick={accuse} disabled={busy || !pick}>
              Accuse! (a miss costs a strike)
            </button>
            <button className="secondary" onClick={() => setAccusing(false)}>
              Back to investigating
            </button>
          </>
        ) : (
          <button className="secondary" onClick={() => setAccusing(true)} disabled={!myTurn}>
            🚨 Ready to accuse someone
          </button>
        ))}
    </div>
  );
}
