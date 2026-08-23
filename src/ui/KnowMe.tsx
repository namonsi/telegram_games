import { useState } from 'react';
import type { KnowMeRoom } from '../game/types';
import type { Player } from '../game/types';
import { api } from '../api';
import { KNOW_ME_QUESTIONS } from '../game/knowmeQuestions';
import { KNOW_ME_ROUNDS, currentQuestion } from '../game/knowme';
import { GameOver, PartnerWait, useWinConfetti } from './shared';
import SocialBar from './SocialBar';

type Props = {
  meId: string;
  room: KnowMeRoom;
  onUpdate: (room: KnowMeRoom) => void;
};

export default function KnowMe({ meId, room, onUpdate }: Props) {
  switch (room.status) {
    case 'waiting':
      return <PartnerWait room={room} />;
    case 'setup':
      return <PickPhase meId={meId} room={room} onUpdate={onUpdate} />;
    case 'playing':
      return <PlayPhase meId={meId} room={room} onUpdate={onUpdate} />;
    case 'finished':
      return <Result meId={meId} room={room} onUpdate={onUpdate} />;
  }
}

function PickPhase({ meId, room, onUpdate }: Props) {
  const [picks, setPicks] = useState<{ q: string; a: string }[]>([]);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const mine = room.picks[meId];
  const other = room.players.find((p) => p.id !== meId);

  const add = () => {
    if (!question || !answer.trim()) return setError('Pick a question and write your secret answer');
    setError(null);
    setPicks([...picks, { q: question, a: answer.trim() }]);
    setQuestion('');
    setAnswer('');
  };

  const lockIn = async () => {
    setBusy(true);
    setError(null);
    try {
      onUpdate(await api.submitPicks(room.id, picks));
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  };

  if (mine || (!other && picks.length === KNOW_ME_ROUNDS)) {
    return (
      <div className="screen">
        <h1>How Well Do You Know Me</h1>
        {!mine && picks.length === KNOW_ME_ROUNDS ? (
          <>
            <p className="muted">Ready! Invite your partner, then lock your answers in.</p>
            <button onClick={lockIn} disabled={busy}>
              {busy ? 'Locking…' : 'Lock answers'}
            </button>
          </>
        ) : (
          <p className="muted">Locked in! Waiting for {other?.firstName ?? 'your partner'} to pick their questions…</p>
        )}
        {!other && <PartnerWait room={room} />}
        <ul className="history">
          {(mine ?? picks).map((c, i) => (
            <li key={i}>{i + 1}. {c.q}</li>
          ))}
        </ul>
      </div>
    );
  }

  const available = KNOW_ME_QUESTIONS.filter((q) => !picks.some((p) => p.q === q));

  return (
    <div className="screen">
      <h1>How Well Do You Know Me</h1>
      <p className="muted">
        Pick {KNOW_ME_ROUNDS} questions about yourself and secretly write YOUR answers. Your partner will have to
        guess them!
      </p>
      <label>
        Question {picks.length + 1} of {KNOW_ME_ROUNDS}
        <select value={question} onChange={(e) => setQuestion(e.target.value)}>
          <option value="" disabled>
            Choose a question…
          </option>
          {available.map((q) => (
            <option key={q} value={q}>
              {q}
            </option>
          ))}
        </select>
      </label>
      <input value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Your secret answer…" maxLength={80} />
      {error && <p className="error">{error}</p>}
      {picks.length < KNOW_ME_ROUNDS && (
        <button onClick={add}>
          {picks.length === KNOW_ME_ROUNDS - 1 ? 'Add final question' : 'Next question'}
        </button>
      )}
      {picks.length === KNOW_ME_ROUNDS && (
        <button onClick={lockIn} disabled={busy}>
          {busy ? 'Locking…' : 'Lock answers in'}
        </button>
      )}
      <ul className="history">
        {picks.map((c, i) => (
          <li key={i}>{i + 1}. {c.q}</li>
        ))}
      </ul>
      {picks.length > 0 && (
        <button className="secondary" onClick={() => setPicks(picks.slice(0, -1))}>
          Undo last
        </button>
      )}
    </div>
  );
}

function PlayPhase({ meId, room, onUpdate }: Props) {
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const shown = currentQuestion(room);
  const myTurn = room.turn === meId;
  const other = room.players.find((p) => p.id !== meId);
  const hitsFor = (id: string) => room.log.filter((e) => e.byId === id && e.correct).length;

  const guess = async () => {
    setBusy(true);
    setError(null);
    try {
      onUpdate(await api.answerKnowMe(room.id, text));
      setText('');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="screen">
      <h1>How Well Do You Know Me</h1>
      <p className="muted">
        Round {Math.floor(room.round / 2) + 1}/{KNOW_ME_ROUNDS} · You {hitsFor(meId)} ·{' '}
        {other?.firstName ?? 'Partner'} {other ? hitsFor(other.id) : 0}
      </p>

      <SocialBar room={room} onUpdate={onUpdate} />

      {shown && (
        <div className="card">
          <p className="muted">What did {shown.askerName} answer?</p>
          <h2>{shown.q}</h2>
        </div>
      )}

      {myTurn ? (
        <>
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Your guess…" maxLength={80} />
          {error && <p className="error">{error}</p>}
          <button onClick={guess} disabled={busy || !text.trim()}>
            {busy ? 'Sending…' : 'Guess their answer'}
          </button>
        </>
      ) : (
        <p className="muted">Waiting for {other?.firstName ?? 'your partner'} to guess…</p>
      )}

      <ul className="history">
        {room.log.map((e, i) => (
          <li key={i}>
            {e.correct ? '✅' : '❌'} {e.text}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Result({ meId, room, onUpdate }: Props) {
  useWinConfetti(room.id);
  const draw = room.winner === null;
  const iWon = room.winner === meId;
  const asker = (round: number): Player => room.players[round % 2];

  let headline: string;
  if (draw) headline = "It's a tie!";
  else if (iWon) headline = 'You win!';
  else headline = `${room.players.find((p) => p.id === room.winner)?.firstName ?? 'Partner'} wins!`;

  return (
    <>
      <GameOver room={room} meId={meId} onUpdate={onUpdate} emoji={draw ? '💞' : iWon ? '🏆' : '💙'} headline={headline} />
      <div className="screen">
        <h3>The big reveal</h3>
        <ul className="history">
          {Array.from({ length: KNOW_ME_ROUNDS * 2 }, (_, round) => {
            const a = asker(round);
            const pick = room.picks[a.id]?.[Math.floor(round / 2)];
            const entry = room.log[round];
            return (
              <li key={round}>
                <b>{pick?.q ?? '?'}</b>
                <br />
                {a.id === meId ? 'You' : a.firstName}: “{pick?.a ?? '?'}” · guessed “{entry?.text ?? '-'}”{' '}
                {entry?.correct ? '✅' : '❌'}
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
}
