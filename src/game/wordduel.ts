import type { Player, WordDuelRoom } from './types.js';
import { otherPlayer } from './engine.js';

export const WORD_LENGTH = 5;
export const WORD_DUEL_TRIES = 6;

export type TileState = 'hit' | 'present' | 'miss';

export function createWordDuel(id: string, creator: Player, wordIndex: number): WordDuelRoom {
  return {
    id,
    kind: 'wordduel',
    players: [creator],
    turn: creator.id,
    wordIndex,
    guesses: {},
    feedbacks: {},
    winner: null,
    status: 'waiting',
    reaction: null,
    chat: null,
    stats: { games: 0, wins: {} },
  };
}

/** standard wordle scoring with duplicate-letter handling */
export function scoreGuess(guess: string, word: string): TileState[] {
  const tiles: TileState[] = Array.from({ length: guess.length }, () => 'miss');
  const rest = new Map<string, number>();
  for (let i = 0; i < word.length; i++) {
    if (guess[i] === word[i]) tiles[i] = 'hit';
    else rest.set(word[i], (rest.get(word[i]) ?? 0) + 1);
  }
  for (let i = 0; i < guess.length; i++) {
    if (tiles[i] === 'hit') continue;
    const left = rest.get(guess[i]) ?? 0;
    if (left > 0) {
      tiles[i] = 'present';
      rest.set(guess[i], left - 1);
    }
  }
  return tiles;
}

export function guessWord(
  room: WordDuelRoom,
  playerId: string,
  guess: string,
  word: string,
): { room: WordDuelRoom; feedback: TileState[]; correct: boolean } {
  if (room.status !== 'playing') throw new Error('Game is not in progress');
  if (room.turn !== playerId) throw new Error('Not your turn');
  const clean = guess.toLowerCase().trim();
  if (!new RegExp(`^[a-z]{${WORD_LENGTH}}$`).test(clean)) throw new Error(`Guess must be ${WORD_LENGTH} letters`);
  const mine = room.guesses[playerId] ?? [];
  if (mine.length >= WORD_DUEL_TRIES) throw new Error('No guesses left');

  const feedback = scoreGuess(clean, word);
  const correct = clean === word;
  const guesses = { ...room.guesses, [playerId]: [...mine, clean] };
  const feedbacks = { ...room.feedbacks, [playerId]: [...(room.feedbacks[playerId] ?? []), feedback] };
  let next: WordDuelRoom = { ...room, guesses, feedbacks };

  if (correct) {
    next = {
      ...next,
      status: 'finished',
      winner: playerId,
      stats: {
        games: next.stats.games + 1,
        wins: { ...next.stats.wins, [playerId]: (next.stats.wins[playerId] ?? 0) + 1 },
      },
    };
    return { room: next, feedback, correct };
  }

  // pass to the partner; if they are out of tries, the turn stays with me
  const opponent = otherPlayer(room.players, playerId).id;
  const opponentHasTries = (next.guesses[opponent]?.length ?? 0) < WORD_DUEL_TRIES;
  next.turn = opponentHasTries ? opponent : playerId;

  const bothOut = next.guesses[playerId].length >= WORD_DUEL_TRIES && !opponentHasTries;
  if (bothOut) {
    next = { ...next, status: 'finished', winner: null, stats: { ...next.stats, games: next.stats.games + 1 } };
  }
  return { room: next, feedback, correct };
}

export function rematchWordDuel(room: WordDuelRoom, wordIndex: number): WordDuelRoom {
  if (room.status !== 'finished') throw new Error('Game is not finished');
  return { ...room, wordIndex, guesses: {}, feedbacks: {}, winner: null, turn: room.players[0].id, status: 'playing' };
}
