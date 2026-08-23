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

const CLUE_ICONS = ['🔎', '🧷', '📍', '💬', '🔦', '⏱️', '🧬', '🖼️'];

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
    <div className={`screen casefile ${room.status === 'playing' ? '' : 'casefile-done'}`}>
      <div className="folder-tab">CASE FILE · CONFIDENTIAL</div>
      <div className="case-head">
        <div className="case-scene">{room.scene}</div>
        <h1>{room.title}</h1>
        {solved && <div className="stamp stamp-solved">CASE CLOSED</div>}
        {cold && <div className="stamp stamp-cold">COLD CASE</div>}
      </div>

      <div className="paper">
        <p>{room.story}</p>
      </div>

      {room.status === 'playing' && <SocialBar room={room} onUpdate={onUpdate} />}

      <h3>
        Evidence board · {room.shown.length}/{room.clueCount} clues
        <span className="strikes">
          {Array.from({ length: MAX_STRIKES }, (_, i) => (
            <span key={i} className={`pip ${i < room.strikes ? 'busted' : ''}`}>
              ❤️
            </span>
          ))}
        </span>
      </h3>

      <div className="evidence-board">
        {room.shown.map((clue, i) => (
          <div key={i} className={`evidence-card tilt-${i % 2}`} style={{ background: 'var(--paper)' }}>
            <span className="pin" />
            <span className="evidence-icon">{CLUE_ICONS[i % CLUE_ICONS.length]}</span>
            <p>
              <b>Clue {i + 1}.</b> {clue}
            </p>
          </div>
        ))}
        {room.shown.length === 0 && (
          <p className="muted empty-board">Nothing pinned yet — start investigating! 🕵️‍♀️</p>
        )}
      </div>

      {error && <p className="error">{error}</p>}

      {solved && (
        <div className="verdict-card solved">
          <span className="verdict-emoji">🎉</span>
          <h2>You cracked the case!</h2>
          {room.solution && <p className="muted">{room.solution}</p>}
        </div>
      )}
      {cold && (
        <div className="verdict-card cold">
          <span className="verdict-emoji">💔</span>
          <h2>The trail went cold…</h2>
          {room.solution && (
            <p className="muted">
              <b>What really happened:</b> {room.solution}
            </p>
          )}
        </div>
      )}

      {room.status === 'playing' && !accusing && (
        <>
          <button onClick={investigate} disabled={busy || !myTurn}>
            {myTurn
              ? room.shown.length >= room.clueCount
                ? 'All clues found — accuse below 👇'
                : `🔍 Investigate clue ${Math.min(room.shown.length + 1, room.clueCount)}`
              : `${other?.firstName ?? 'Partner'} is on the case…`}
          </button>
          <button className="secondary" onClick={() => setAccusing(true)} disabled={!myTurn}>
            🚨 Ready to name the culprit
          </button>
        </>
      )}

      {room.status === 'playing' && accusing && (
        <>
          <h3>Suspect line-up — who did it?</h3>
          <div className="suspect-row">
            {room.suspects.map((s) => (
              <button
                key={s.id}
                className={`suspect-card ${pick === s.id ? 'picked' : ''}`}
                onClick={() => setPick(s.id)}
                style={{ ['--sc' as string]: s.color ?? '#555' }}
              >
                <span className="suspect-avatar">{s.avatar ?? '🧑'}</span>
                <b>{s.name}</b>
                <span className="muted">{s.blurb}</span>
              </button>
            ))}
          </div>
          <button onClick={accuse} disabled={busy || !pick}>
            Accuse! (a miss costs a heart)
          </button>
          <button className="secondary" onClick={() => setAccusing(false)}>
            Back to investigating
          </button>
        </>
      )}
    </div>
  );
}
