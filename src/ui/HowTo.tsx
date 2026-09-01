import { useEffect, useState } from 'react';
import type { GameKind } from '../game/types';

const HOWTOS: Record<GameKind, { emoji: string; name: string; steps: string[] }> = {
  number: {
    emoji: '🔢',
    name: 'Guess the Number',
    steps: [
      'You each secretly pick a number in the chosen range.',
      'Take turns guessing the other\'s number — you\'ll hear "higher" or "lower" after every miss.',
      'Narrow it down and hit the exact number first to win.',
    ],
  },
  knowme: {
    emoji: '💕',
    name: 'How Well Do You Know Me',
    steps: [
      'Each of you picks 5 questions and secretly writes YOUR OWN answers.',
      'Then take turns guessing what your partner answered for each question.',
      'Most correct guesses wins. Every answer is revealed at the end — get ready to blush.',
    ],
  },
  battleship: {
    emoji: '🚢',
    name: 'Battleship',
    steps: [
      'Place 3 ships (4, 3 and 2 cells): press a cell, drag across in a straight line, release.',
      'Take turns firing at your partner\'s waters — 💥 is a hit, 💧 is a miss.',
      'First to hit all 9 enemy ship cells wins. Ship positions stay secret until the end.',
    ],
  },
  twenty: {
    emoji: '❓',
    name: '20 Questions',
    steps: [
      'One of you thinks of anything and locks it in as a secret.',
      'The other asks up to 20 questions — answered with Yes, Maybe or No.',
      'A wrong final guess burns one of your 20 chances. Crack the secret before they run out, then swap roles.',
    ],
  },
  mystery: {
    emoji: '🕵️',
    name: 'Murder Mystery',
    steps: [
      'You investigate a case TOGETHER — take turns uncovering evidence one by one.',
      'Talk it through (use the chat!), then accuse a suspect when you\'re confident.',
      'Each of you gets ONE wrong accusation — two misses and the case goes cold. Solve it for a shared win.',
    ],
  },
  quiz: {
    emoji: '🧠',
    name: 'Quiz Duel',
    steps: [
      'You both get the same multiple-choice question and answer secretly.',
      'When both have answered, the correct one is revealed — a correct answer scores a point.',
      'First to 7 points wins. Ties keep going until someone leads.',
    ],
  },
  wordduel: {
    emoji: '🔤',
    name: 'Word Duel',
    steps: [
      'You both crack the SAME hidden 5-letter word — 6 guesses each, taking turns (the host starts).',
      'Tiles light up: 🟩 right spot, 🟨 right letter wrong spot, ⬛ not in the word.',
      'First to solve wins. If you burn all six guesses, you can only watch — no peeking at their letters!',
    ],
  },
  emoji: {
    emoji: '🧩',
    name: 'Emoji Riddles',
    steps: [
      'A string of emojis hints at a movie, song or phrase — you both answer the same one secretly.',
      'Close spelling counts ("Titanic!" = "titanic"). One answer per riddle each.',
      'First to 7 correct wins. Answers reveal after you both lock in.',
    ],
  },
  crazy8s: {
    emoji: '🃏',
    name: 'Crazy 8s',
    steps: [
      'Match the top card by color or number — or play a Wild to change the color.',
      'Special cards: Skip (opponent loses turn), Draw 2, and Wild Draw 4 force your partner to pick up.',
      'First to empty their hand wins. If the deck runs out, the discard pile is reshuffled.',
    ],
  },
  heist: {
    emoji: '🏦',
    name: 'Heist',
    steps: [
      'One player is the Vault Runner (thief), the other is Security (guards).',
      'Vault Runner: collect all loot and reach the exit. Avoid guards!',
      'Security: move guards to catch the thief. Use preset messages to communicate.',
    ],
  },
};

/** corner "?" button + tutorial overlay; closes via the X, the backdrop, or Escape */
export default function HowTo({ kind, autoOpen = false }: { kind: GameKind; autoOpen?: boolean }) {
  const [open, setOpen] = useState(false);
  const t = HOWTOS[kind];

  // invitees get the tutorial popped once per session so they know the rules
  useEffect(() => {
    if (!autoOpen) return;
    const key = `howto-seen-${kind}`;
    if (!sessionStorage.getItem(key)) {
      sessionStorage.setItem(key, '1');
      setOpen(true);
    }
  }, [autoOpen, kind]);

  return (
    <>
      <button className="howto-btn" onClick={() => setOpen(true)} aria-label="How to play">
        ?
      </button>
      {open && (
        <div className="howto-overlay" onClick={() => setOpen(false)} role="dialog" aria-label={`How to play ${t.name}`}>
          <div className="howto-card" onClick={(e) => e.stopPropagation()}>
            <button className="howto-x" onClick={() => setOpen(false)} aria-label="Close tutorial">
              ✕
            </button>
            <h2>
              {t.emoji} {t.name}
            </h2>
            <ol>
              {t.steps.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ol>
            <p className="muted howto-foot">Have fun 💞</p>
          </div>
        </div>
      )}
    </>
  );
}
