import { useState } from 'react';
import type { QuizRoom } from '../game/types';
import { api } from '../api';
import { QUIZ_TARGET } from '../game/quiz';
import { GameOver, PartnerWait, useWinConfetti } from './shared';
import SocialBar from './SocialBar';

type Props = {
  meId: string;
  room: QuizRoom;
  onUpdate: (room: QuizRoom) => void;
};

export default function QuizDuel({ meId, room, onUpdate }: Props) {
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

const LETTERS = ['A', 'B', 'C', 'D'];

function Play({ meId, room, onUpdate }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const other = room.players.find((p) => p.id !== meId);
  const q = room.currentQ;
  const myPick = room.picks[meId];
  const theirPick = other ? room.picks[other.id] : undefined;
  const last = room.results[room.results.length - 1];
  const justRevealed = last && room.picks[meId] === undefined;

  const answer = async (choice: number) => {
    setBusy(true);
    setError(null);
    try {
      onUpdate(await api.answerQuiz(room.id, choice));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="screen">
      <h1>Quiz Duel</h1>
      <p className="muted">
        First to {QUIZ_TARGET} · You {room.scores[meId] ?? 0} — {other?.firstName ?? 'Partner'}{' '}
        {other ? (room.scores[other.id] ?? 0) : 0}
      </p>

      <SocialBar room={room} onUpdate={onUpdate} />

      {q && (
        <div className="card">
          <h2>{q.q}</h2>
          <div className="quiz-opts">
            {q.options.map((opt, i) => (
              <button
                key={i}
                className={`opt ${myPick === i ? 'picked' : ''}`}
                onClick={() => answer(i)}
                disabled={busy || myPick !== undefined}
              >
                <b>{LETTERS[i]}</b> {opt}
              </button>
            ))}
          </div>
        </div>
      )}

      {myPick !== undefined && theirPick === undefined && (
        <p className="muted">Answer locked. Waiting for {other?.firstName ?? 'partner'}…</p>
      )}

      {error && <p className="error">{error}</p>}

      {justRevealed && last && (
        <div className="card">
          <p className="muted">
            Answer was: <b>{LETTERS[last.correct]}. {last.options[last.correct]}</b>
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
      ? 'Quiz champion! 🧠'
      : `${other?.firstName ?? 'Partner'} wins the duel!`;

  return (
    <>
      <GameOver room={room} meId={meId} onUpdate={onUpdate} emoji={draw ? '🤝' : iWon ? '🏆' : '🧠'} headline={headline} />
      <div className="screen">
        <h3>Round recap</h3>
        <ul className="history">
          {room.results.map((r, i) => (
            <li key={i}>
              <b>{r.q}</b>
              <br />
              <span className="muted">
                Answer: {r.options[r.correct]} · You:{' '}
                {r.picks[meId] === r.correct ? '✅' : `❌ (${r.picks[meId] !== undefined ? r.options[r.picks[meId]] : '-'})`}
                {other && ` · ${r.picks[other.id] === r.correct ? '✅' : '❌'}`}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
