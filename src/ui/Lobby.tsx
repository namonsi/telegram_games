import { useState } from 'react';
import type { GameKind, Room } from '../game/types';
import { api, inviteLink, type SurpriseKind } from '../api';

type Me = { id: string; firstName: string; photoUrl?: string; username?: string };

type Props = {
  me: Me;
  room?: Room;
  onCreated: (room: Room) => void;
  onJoin: (roomId: string) => void;
  joinError: string | null;
};

const GAMES: { kind: GameKind; emoji: string; name: string; tagline: string }[] = [
  { kind: 'knowme', emoji: '💕', name: 'How Well Do You Know Me', tagline: 'Guess each other\'s secret answers' },
  { kind: 'battleship', emoji: '🚢', name: 'Battleship', tagline: 'Hunt down your partner\'s fleet' },
  { kind: 'twenty', emoji: '❓', name: '20 Questions', tagline: 'Read their mind in 20 tries' },
  { kind: 'mystery', emoji: '🕵️', name: 'Murder Mystery', tagline: 'Solve a cozy case together' },
  { kind: 'quiz', emoji: '🧠', name: 'Quiz Duel', tagline: 'General knowledge showdown' },
  { kind: 'number', emoji: '🔢', name: 'Guess the Number', tagline: 'The classic — find their secret number' },
];

// the surprise is reserved for this account
const SURPRISE_USERNAME = 'namon_si';

export default function Lobby({ me, room, onCreated, onJoin, joinError }: Props) {
  const [kind, setKind] = useState<GameKind>('knowme');
  const [min, setMin] = useState(1);
  const [max, setMax] = useState(100);
  const [name, setName] = useState(me.firstName);
  const [joinId, setJoinId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [gift, setGift] = useState<SurpriseKind | null>(null);

  if (room) {
    const other = room.players.find((p) => p.id !== me.id);
    return (
      <div className="screen">
        <h1>Waiting for your partner</h1>
        <p className="muted">Share the invite so they can join your room.</p>
        <div className="card">
          <code className="link">{inviteLink(room.id, gift ?? undefined)}</code>
          <button className="secondary" onClick={() => navigator.clipboard.writeText(inviteLink(room.id, gift ?? undefined)).catch(() => {})}>
            Copy invite
          </button>
          {(me.username ?? '').toLowerCase() === SURPRISE_USERNAME && (
            <div className="surprise-pick">
              <p className="muted">🎀 Attach a surprise to this link:</p>
              <div className="row wrap">
                {(['note', 'gift', 'random'] as SurpriseKind[]).map((g) => (
                  <button
                    key={g}
                    className={`chip ${gift === g ? 'on' : ''}`}
                    onClick={() => setGift(gift === g ? null : g)}
                  >
                    {g === 'note' ? '💌 Love note' : g === 'gift' ? '🎁 Virtual gift' : '✨ Random'}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <p className="muted">{other ? `Waiting for ${other.firstName}…` : 'No one here yet…'}</p>
      </div>
    );
  }

  const start = async () => {
    setBusy(true);
    setError(null);
    try {
      const created = await api.create(kind, { min, max }, name.trim() || me.firstName);
      onCreated(created);
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  };

  return (
    <div className="screen">
      <h1>Game night 💞</h1>
      <p className="muted">Pick a game to play together.</p>

      <label>
        Your name
        <input value={name} onChange={(e) => setName(e.target.value)} />
      </label>

      <div className="picker-grid">
        {GAMES.map((g) => (
          <button
            key={g.kind}
            className={`tile ${kind === g.kind ? 'on' : ''}`}
            onClick={() => setKind(g.kind)}
          >
            <span className="tile-emoji">{g.emoji}</span>
            <b>{g.name}</b>
            <span className="muted">{g.tagline}</span>
          </button>
        ))}
      </div>

      {kind === 'number' && (
        <div className="row">
          <label>
            Range min
            <input type="number" value={min} onChange={(e) => setMin(Number(e.target.value))} />
          </label>
          <label>
            Range max
            <input type="number" value={max} onChange={(e) => setMax(Number(e.target.value))} />
          </label>
        </div>
      )}

      {error && <p className="error">{error}</p>}
      {joinError && <p className="error">{joinError}</p>}
      <button onClick={start} disabled={busy}>
        {busy ? 'Creating…' : `Start ${GAMES.find((g) => g.kind === kind)?.name}`}
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
