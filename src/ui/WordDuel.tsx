import { useState } from 'react';
import type { TileState, WordDuelRoom } from '../game/types';
import { api } from '../api';
import { WORD_DUEL_TRIES, WORD_LENGTH } from '../game/wordduel';
import { GameOver, PartnerWait, useWinConfetti } from './shared';
import SocialBar from './SocialBar';

type Props = {
  meId: string;
  room: WordDuelRoom;
  onUpdate: (room: WordDuelRoom) => void;
};

const ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];

const TILE_CLASS: Record<TileState, string> = {
  hit: 'hit',
  present: 'present',
  miss: 'miss',
};

export default function WordDuel({ meId, room, onUpdate }: Props) {
  switch (room.status) {
    case 'waiting':
      return <PartnerWait room={room} />;
    case 'setup':
    case 'playing':
      return <Play meId={meId} room={room} onUpdate={onUpdate} />;
    case 'finished':
      return <Result meId={meId} room={room} onUpdate={onUpdate} />;
  }
}

function Play({ meId, room, onUpdate }: Props) {
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const other = room.players.find((p) => p.id !== meId);
  const myGuesses = room.guesses[meId] ?? [];
  const myFeedbacks = room.feedbacks[meId] ?? [];
  const outOfTries = myGuesses.length >= WORD_DUEL_TRIES;
  const partnerTries = other ? (room.progress?.[other.id] ?? 0) : 0;
  const myTurn = room.turn === meId;

  const submit = async () => {
    if (draft.length !== WORD_LENGTH) return setError(`The word has ${WORD_LENGTH} letters`);
    setBusy(true);
    setError(null);
    try {
      onUpdate(await api.guessWord(room.id, draft));
      setDraft('');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const pressKey = (letter: string) => {
    if (myTurn && draft.length < WORD_LENGTH && !outOfTries) setDraft(draft + letter);
  };
  const backspace = () => setDraft(draft.slice(0, -1));

  // best-known state per letter for the keyboard coloring
  const keyState: Record<string, TileState> = {};
  myFeedbacks.forEach((row, r) =>
    row.forEach((tile, i) => {
      const letter = myGuesses[r]?.[i] ?? '';
      if (!letter) return;
      const rank = { miss: 0, present: 1, hit: 2 };
      if ((rank[tile] ?? 0) > (rank[keyState[letter]] ?? -1)) keyState[letter] = tile;
    }),
  );

  return (
    <div className="screen">
      <h1>Word Duel</h1>
      <p className="muted">
        Same hidden word for both of you · You {myGuesses.length}/{WORD_DUEL_TRIES} ·{' '}
        {other?.firstName ?? 'Partner'} {partnerTries}/{WORD_DUEL_TRIES}
      </p>

      <SocialBar room={room} onUpdate={onUpdate} />

      <div className="word-grid">
        {Array.from({ length: WORD_DUEL_TRIES }, (_, row) => {
          const guess = myGuesses[row];
          const feedback = myFeedbacks[row];
          return (
            <div className="word-row" key={row}>
              {Array.from({ length: WORD_LENGTH }, (_, col) => {
                const letter = guess?.[col] ?? (row === myGuesses.length ? draft[col] ?? '' : '');
                const state = feedback?.[col];
                return (
                  <div key={col} className={`word-tile ${state ? TILE_CLASS[state] : ''} ${!guess && letter ? 'draft' : ''}`}>
                    {letter.toUpperCase()}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {outOfTries ? (
        <p className="muted">Out of guesses — waiting for {other?.firstName ?? 'your partner'}…</p>
      ) : !myTurn ? (
        <p className="muted">{other?.firstName ?? 'Partner'} is guessing… your turn is next.</p>
      ) : (
        <>
          <div className="word-keyboard">
            {ROWS.map((row) => (
              <div className="key-row" key={row}>
                {row.split('').map((letter) => (
                  <button key={letter} className={`key ${keyState[letter] ? TILE_CLASS[keyState[letter]] : ''}`} onClick={() => pressKey(letter)}>
                    {letter.toUpperCase()}
                  </button>
                ))}
              </div>
            ))}
            <div className="key-row">
              <button className="key wide" onClick={backspace}>
                ⌫
              </button>
              <button className="key wide primary" onClick={submit} disabled={busy || draft.length !== WORD_LENGTH}>
                Guess
              </button>
            </div>
          </div>
          {error && <p className="error">{error}</p>}
        </>
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
    ? 'Nobody cracked it!'
    : iWon
      ? 'Word master! 🏆'
      : `${other?.firstName ?? 'Partner'} cracked it first!`;
  return (
    <>
      <GameOver room={room} meId={meId} onUpdate={onUpdate} emoji={draw ? '🤷' : iWon ? '🏆' : '📖'} headline={headline} />
      <div className="screen">
        {room.solution && (
          <p className="muted">
            The word was: <b>{room.solution.toUpperCase()}</b>
          </p>
        )}
        {room.players.map((p) => (
          <div key={p.id}>
            <p className="muted">{p.id === meId ? 'Your guesses' : `${p.firstName}'s guesses`}</p>
            <div className="word-grid small">
              {(room.guesses[p.id] ?? []).map((guess, row) => (
                <div className="word-row" key={row}>
                  {guess.split('').map((letter, col) => (
                    <div key={col} className={`word-tile ${TILE_CLASS[room.feedbacks[p.id]?.[row]?.[col] ?? 'miss']}`}>
                      {letter.toUpperCase()}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
