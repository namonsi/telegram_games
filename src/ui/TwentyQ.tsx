import { useState } from 'react';
import type { TwentyRoom, Verdict } from '../game/types';
import { api } from '../api';
import { TWENTY_MAX } from '../game/twenty';
import { GameOver, PartnerWait, useWinConfetti } from './shared';
import SocialBar from './SocialBar';

type Props = {
  meId: string;
  room: TwentyRoom;
  onUpdate: (room: TwentyRoom) => void;
};

export default function TwentyQ({ meId, room, onUpdate }: Props) {
  switch (room.status) {
    case 'waiting':
    case 'setup':
      return <Setup meId={meId} room={room} onUpdate={onUpdate} />;
    case 'playing':
      return <Play meId={meId} room={room} onUpdate={onUpdate} />;
    case 'finished':
      return <Result meId={meId} room={room} onUpdate={onUpdate} />;
  }
}

function Setup({ meId, room, onUpdate }: Props) {
  const [secret, setSecret] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const other = room.players.find((p) => p.id !== meId);
  const iAnswer = room.answererId === meId;

  const lock = async () => {
    setBusy(true);
    setError(null);
    try {
      onUpdate(await api.setSecret(room.id, secret));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="screen">
      <h1>20 Questions</h1>
      {iAnswer ? (
        <>
          <p className="muted">
            Think of anything — an object, a memory, a food, a person. {other?.firstName ?? 'Your partner'} gets 20
            questions to figure it out. Keep it sweet… or sneaky.
          </p>
          {!other && <PartnerWait room={room} />}
          <input value={secret} onChange={(e) => setSecret(e.target.value)} placeholder="Your secret thing…" maxLength={80} />
          {error && <p className="error">{error}</p>}
          <button onClick={lock} disabled={busy || !secret.trim() || Boolean(room.secret)}>
            {busy ? 'Locking…' : room.secret ? 'Locked ✓' : 'Lock it in'}
          </button>
        </>
      ) : (
        <p className="muted">
          Waiting for your partner to think of something mysterious…
        </p>
      )}
    </div>
  );
}

const VERDICTS: { v: Verdict; label: string }[] = [
  { v: 'yes', label: 'Yes ✅' },
  { v: 'maybe', label: 'Maybe 🤔' },
  { v: 'no', label: 'No ❌' },
];

function Play({ meId, room, onUpdate }: Props) {
  const [question, setQuestion] = useState('');
  const [finalGuess, setFinalGuess] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const other = room.players.find((p) => p.id !== meId);
  const iAnswer = room.answererId === meId;

  const run = async (fn: () => Promise<TwentyRoom>) => {
    setBusy(true);
    setError(null);
    try {
      onUpdate(await fn());
      setQuestion('');
      setFinalGuess('');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="screen">
      <h1>20 Questions</h1>
      <p className="muted">
        Used {room.used}/{TWENTY_MAX} · {iAnswer ? `${other?.firstName ?? 'They'} are guessing` : `You are guessing ${other?.firstName ?? "partner"}'s secret`}
      </p>

      <SocialBar room={room} onUpdate={onUpdate} />

      {iAnswer ? (
        room.question ? (
          <div className="card">
            <p className="muted">Their question:</p>
            <h2>{room.question}</h2>
            <div className="row">
              {VERDICTS.map(({ v, label }) => (
                <button key={v} disabled={busy} onClick={() => run(() => api.answerTwenty(room.id, v))}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <p className="muted">Waiting for the next question…</p>
        )
      ) : (
        <>
          <label>
            Ask a question
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Is it something you can eat?"
              maxLength={120}
            />
          </label>
          <button onClick={() => run(() => api.askTwenty(room.id, question))} disabled={busy || !question.trim()}>
            Ask ({TWENTY_MAX - room.used} left)
          </button>

          <h3>Feeling brave?</h3>
          <input value={finalGuess} onChange={(e) => setFinalGuess(e.target.value)} placeholder="Final guess…" maxLength={80} />
          <button className="secondary" onClick={() => run(() => api.guessSecret(room.id, finalGuess))} disabled={busy || !finalGuess.trim()}>
            Guess it! (uses one)
          </button>
        </>
      )}

      {error && <p className="error">{error}</p>}

      <ul className="history">
        {[...room.log].reverse().map((e, i) => (
          <li key={i}>
            <b>Q{room.log.length - i}:</b> {e.q} — <b>{e.a}</b>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Result({ meId, room, onUpdate }: Props) {
  useWinConfetti(room.id);
  const iWon = room.winner === meId;
  const answererName = room.players.find((p) => p.id === room.answererId)?.firstName ?? 'Partner';
  return (
    <>
      <GameOver
        room={room}
        meId={meId}
        onUpdate={onUpdate}
        emoji={iWon ? '🏆' : '🕵️'}
        headline={iWon ? 'You cracked it!' : `${answererName} stumped you!`}
      />
      <div className="screen">
        <p className="muted">
          The secret was: <b>{room.secret}</b>
        </p>
        <ul className="history">
          {room.log.map((e, i) => (
            <li key={i}>
              <b>Q{i + 1}:</b> {e.q} — <b>{e.a}</b>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
