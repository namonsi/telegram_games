import { useEffect, useState } from 'react';
import type { NumberRoom } from '../game/types';
import { api } from '../api';

const EMOJIS = ['❤️', '😂', '😘', '😤', '🔥', '🙈'];

type Props = {
  me: { id: string; firstName: string; photoUrl?: string };
  room: NumberRoom;
  onUpdate: (room: NumberRoom) => void;
};

export default function GameBoard({ me, room, onUpdate }: Props) {
  const [value, setValue] = useState('');
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const current = room.players.find((p) => p.id === room.turn);
  const myTurn = room.turn === me.id;
  const last = room.history[room.history.length - 1];
  const lastHint = last ? last.hint : null;
  const lastPlayer = last ? room.players.find((p) => p.id === last.playerId)?.firstName : null;

  const reaction = room.reaction && room.reaction.expiresAt > Date.now() ? room.reaction : null;
  const chat = room.chat && room.chat.expiresAt > Date.now() ? room.chat : null;

  // ponytail: local TTL so the bubble can fade before the next 2s poll clears it
  const [bubbleKey, setBubbleKey] = useState(0);
  useEffect(() => {
    if (room.reaction || room.chat) setBubbleKey((k) => k + 1);
  }, [room.reaction?.emoji, room.chat?.text]);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const next = await api.guess(room.id, Number(value));
      onUpdate(next as NumberRoom);
      setValue('');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const sendReaction = async (emoji: string) => {
    const next = await api.react(room.id, emoji);
    onUpdate(next as NumberRoom);
  };

  const sendChat = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const next = await api.chat(room.id, trimmed);
    onUpdate(next as NumberRoom);
    setText('');
  };

  return (
    <div className="screen">
      <h1>Guess the Number</h1>
      <p className="muted">
        Range {room.range.min}–{room.range.max} · Round {room.stats.games + 1}
      </p>

      {reaction && (
        <div className="bubble bubble-react" key={`r${bubbleKey}`}>
          <span className="emoji">{reaction.emoji}</span>
        </div>
      )}
      {chat && (
        <div className="bubble" key={`c${bubbleKey}`}>
          <b>{chat.sender}</b> {chat.text}
        </div>
      )}

      {lastHint && (
        <div className={`card hint-${lastHint}`}>
          {lastPlayer} guessed {last.value} — it was{' '}
          <b>{lastHint === 'hit' ? 'spot on!' : lastHint === 'higher' ? 'too low, go higher' : 'too high, go lower'}</b>
        </div>
      )}

      {myTurn ? (
        <div>
          <h2>Your turn</h2>
          <input
            type="number"
            value={value}
            min={room.range.min}
            max={room.range.max}
            onChange={(e) => setValue(e.target.value)}
            placeholder={`${room.range.min}–${room.range.max}`}
          />
          {error && <p className="error">{error}</p>}
          <button onClick={submit} disabled={busy}>
            {busy ? 'Guessing…' : 'Guess'}
          </button>
        </div>
      ) : (
        <p className="muted">Waiting for {current?.firstName ?? 'your partner'} to guess…</p>
      )}

      <div className="react-row">
        {EMOJIS.map((e) => (
          <button key={e} className="emoji-btn" onClick={() => sendReaction(e)} aria-label={`React ${e}`}>
            {e}
          </button>
        ))}
      </div>

      <div className="row">
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Say something…" maxLength={160} />
        <button className="secondary" onClick={sendChat} disabled={!text.trim()}>
          Send
        </button>
      </div>

      <h3>Guess history</h3>
      <ul className="history">
        {room.history.length === 0 && <li className="muted">No guesses yet</li>}
        {room.history.map((g, i) => (
          <li key={i}>
            {room.players.find((p) => p.id === g.playerId)?.firstName}: {g.value} →{' '}
            {g.hint === 'hit' ? 'hit' : g.hint === 'higher' ? 'higher' : 'lower'}
          </li>
        ))}
      </ul>
    </div>
  );
}
