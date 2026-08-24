import { useState } from 'react';
import type { EmojiRoom } from '../game/types';
import { api } from '../api';
import { EMOJI_TARGET, normalizeAnswer } from '../game/emojiriddle';
import { GameOver, PartnerWait, useWinConfetti } from './shared';
import SocialBar from './SocialBar';

type Props = {
  meId: string;
  room: EmojiRoom;
  onUpdate: (room: EmojiRoom) => void;
};

export default function EmojiRiddles({ meId, room, onUpdate }: Props) {
  switch (room.status) {
    case 'waiting':
    case 'setup':
      return <PartnerWait room={room} />;
    case 'playing':
      return <Play meId={meId} room={room} onUpdate={onUpdate} />;
    case 'finished':
      return <Result meId={meId} room={room} onUpdate={onUpdate} />;
  }
}

function Play({ meId, room, onUpdate }: Props) {
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const other = room.players.find((p) => p.id !== meId);
  const riddle = room.currentRiddle;
  const myPick = room.picks[meId];
  const theirPick = other ? room.picks[other.id] : undefined;
  const myAnswered = myPick !== undefined;
  const last = room.results[room.results.length - 1];
  const justRevealed = last && !myAnswered;

  const answer = async () => {
    setBusy(true);
    setError(null);
    try {
      onUpdate(await api.answerEmoji(room.id, text));
      setText('');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="screen">
      <h1>Emoji Riddles</h1>
      <p className="muted">
        First to {EMOJI_TARGET} · You {room.scores[meId] ?? 0} — {other?.firstName ?? 'Partner'}{' '}
        {other ? (room.scores[other.id] ?? 0) : 0}
      </p>

      <SocialBar room={room} onUpdate={onUpdate} />

      {riddle && (
        <div className="card riddle-card">
          <span className="riddle-category">{riddle.category}</span>
          <div className="riddle-emojis">{riddle.emojis}</div>
          {myAnswered ? (
            <p className="muted">
              You answered “{myPick}”. Waiting for {other?.firstName ?? 'partner'}…
            </p>
          ) : (
            <>
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Your answer…"
                maxLength={60}
              />
              <button onClick={answer} disabled={busy || !text.trim()}>
                {busy ? 'Sending…' : 'Answer'}
              </button>
            </>
          )}
        </div>
      )}

      {myAnswered && theirPick === undefined && (
        <p className="muted">Answer locked. {other?.firstName ?? 'Partner'} is still thinking…</p>
      )}

      {error && <p className="error">{error}</p>}

      {justRevealed && last && (
        <div className="card hint-hit">
          <p className="muted">
            Answer was: <b>{last.answer}</b>
          </p>
        </div>
      )}
    </div>
  );
}

function Result({ meId, room, onUpdate }: Props) {
  useWinConfetti(room.id);
  const draw = room.winner === null;
  const iWon = room.winner === meId;
  const other = room.players.find((p) => p.id !== meId);
  const headline = draw
    ? "It's a tie!"
    : iWon
      ? 'Riddle royalty! 👑'
      : `${other?.firstName ?? 'Partner'} wins!`;

  return (
    <>
      <GameOver room={room} meId={meId} onUpdate={onUpdate} emoji={draw ? '🤝' : iWon ? '👑' : '🧩'} headline={headline} />
      <div className="screen">
        <h3>Riddle recap</h3>
        <ul className="history">
          {room.results.map((r, i) => (
            <li key={i}>
              {r.emojis}
              <br />
              <span className="muted">
                Answer: <b>{r.answer}</b> · You:{' '}
                {normalizeAnswer(r.picks[meId] ?? '') === normalizeAnswer(r.answer) ? '✅' : `❌ (${r.picks[meId] || '-'})`}
                {other &&
                  ` · ${normalizeAnswer(r.picks[other.id] ?? '') === normalizeAnswer(r.answer) ? '✅' : '❌'}`}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
