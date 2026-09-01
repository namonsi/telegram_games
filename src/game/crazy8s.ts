import type { Crazy8sRoom, Color, Player } from './types.js';
import { otherPlayer } from './engine.js';

const COLORS: Color[] = ['red', 'blue', 'green', 'yellow'];

export type Face = number | 'skip' | 'draw2' | 'wild' | 'wild4';

export function getColor(card: number): Color | 'wild' {
  if (card >= 52) return 'wild';
  return COLORS[Math.floor(card / 13)];
}

export function getFace(card: number): Face {
  if (card >= 56) return 'wild4';
  if (card >= 52) return 'wild';
  const face = card % 13;
  if (face === 10) return 'skip';
  if (face === 11) return 'draw2';
  return face; // 0-9 or 12 (treated as numbered, but 12 = unused → just a number)
}

export function cardLabel(card: number): string {
  const color = getColor(card);
  const face = getFace(card);
  if (face === 'wild') return 'Wild';
  if (face === 'wild4') return 'Wild4';
  const colorLetter = color === 'red' ? 'R' : color === 'blue' ? 'B' : color === 'green' ? 'G' : 'Y';
  if (face === 'skip') return `${colorLetter}Skip`;
  if (face === 'draw2') return `${colorLetter}+2`;
  return `${colorLetter}${face}`;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildDeck(): number[] {
  return Array.from({ length: 60 }, (_, i) => i);
}

export function canPlay(card: number, topDiscard: number, currentColor: Color): boolean {
  const color = getColor(card);
  if (color === 'wild') return true;
  if (color === currentColor) return true;
  return getFace(card) === getFace(topDiscard);
}

function reshuffleDiscard(discard: number[]): { deck: number[]; topCard: number } {
  const topCard = discard[discard.length - 1];
  const rest = discard.slice(0, -1);
  return { deck: shuffle(rest), topCard };
}

export function createCrazy8s(id: string, creator: Player): Crazy8sRoom {
  return {
    id,
    kind: 'crazy8s',
    players: [creator],
    turn: '',
    deck: [],
    discard: [],
    hands: {},
    currentColor: 'red',
    winner: null,
    status: 'waiting',
    reaction: null,
    chat: null,
    stats: { games: 0, wins: {} },
  };
}

function initGame(players: Player[]): {
  deck: number[];
  discard: number[];
  hands: Record<string, number[]>;
  currentColor: Color;
} {
  const deck = shuffle(buildDeck());
  const hands: Record<string, number[]> = {};
  let remaining = [...deck];

  for (const p of players) {
    hands[p.id] = remaining.splice(0, 7);
  }

  let discard: number[] = [];
  let topCard: number;
  while (true) {
    topCard = remaining.pop()!;
    const color = getColor(topCard);
    if (color !== 'wild') {
      discard.push(topCard);
      break;
    }
    remaining.unshift(topCard);
  }

  return { deck: remaining, discard, hands, currentColor: getColor(topCard) as Color };
}

export function startCrazy8s(room: Crazy8sRoom): Crazy8sRoom {
  const { deck, discard, hands, currentColor } = initGame(room.players);
  return { ...room, deck, discard, hands, currentColor, turn: room.players[0].id, status: 'playing', winner: null };
}

export function playCard(
  room: Crazy8sRoom,
  playerId: string,
  cardIndex: number,
  chosenColor?: Color,
): { room: Crazy8sRoom } {
  if (room.status !== 'playing') throw new Error('Game is not in progress');
  if (room.turn !== playerId) throw new Error('Not your turn');

  const hand = room.hands[playerId];
  if (!hand || cardIndex < 0 || cardIndex >= hand.length) throw new Error('Invalid card index');

  const card = hand[cardIndex];
  const topDiscard = room.discard[room.discard.length - 1];

  if (!canPlay(card, topDiscard, room.currentColor)) {
    throw new Error('Cannot play this card');
  }

  const color = getColor(card);
  if (color === 'wild') {
    if (!chosenColor || !COLORS.includes(chosenColor)) {
      throw new Error('Must choose a color for wild');
    }
  }

  const newHand = [...hand];
  newHand.splice(cardIndex, 1);
  const hands = { ...room.hands, [playerId]: newHand };

  let newDiscard = [...room.discard, card];
  const currentColor = color === 'wild' ? chosenColor! : getColor(card) as Color;
  const face = getFace(card);
  const opponentId = otherPlayer(room.players, playerId).id;

  let nextTurn = opponentId;
  let nextHands = { ...hands };
  let remainingDeck = [...room.deck];

  if (face === 'skip' || face === 'draw2' || face === 'wild4') {
    const drawCount = face === 'draw2' ? 2 : face === 'wild4' ? 4 : 0;
    if (drawCount > 0) {
      const drawn: number[] = [];
      for (let i = 0; i < drawCount; i++) {
        if (remainingDeck.length === 0 && newDiscard.length > 1) {
          const reshuffled = reshuffleDiscard(newDiscard);
          remainingDeck = reshuffled.deck;
          newDiscard = [reshuffled.topCard];
        }
        if (remainingDeck.length > 0) {
          drawn.push(remainingDeck.pop()!);
        }
      }
      nextHands = {
        ...nextHands,
        [opponentId]: [...(nextHands[opponentId] ?? []), ...drawn],
      };
    }
    // skip, draw2, wild4: current player goes again
    nextTurn = playerId;
  }

  const won = newHand.length === 0;

  if (remainingDeck.length === 0 && newDiscard.length > 1) {
    const reshuffled = reshuffleDiscard(newDiscard);
    remainingDeck = reshuffled.deck;
    newDiscard = [reshuffled.topCard];
  }

  const next: Crazy8sRoom = {
    ...room,
    hands: nextHands,
    discard: newDiscard,
    currentColor,
    deck: remainingDeck,
    turn: won ? '' : nextTurn,
    status: won ? 'finished' : 'playing',
    winner: won ? playerId : null,
    stats: won
      ? { games: room.stats.games + 1, wins: { ...room.stats.wins, [playerId]: (room.stats.wins[playerId] ?? 0) + 1 } }
      : room.stats,
  };

  return { room: next };
}

export function drawCard(room: Crazy8sRoom, playerId: string): { room: Crazy8sRoom; drawn: number } {
  if (room.status !== 'playing') throw new Error('Game is not in progress');
  if (room.turn !== playerId) throw new Error('Not your turn');

  let remainingDeck = [...room.deck];
  let discard = [...room.discard];

  if (remainingDeck.length === 0 && discard.length > 1) {
    const reshuffled = reshuffleDiscard(discard);
    remainingDeck = reshuffled.deck;
    discard = [reshuffled.topCard];
  }

  if (remainingDeck.length === 0) throw new Error('No cards left to draw');

  const drawn = remainingDeck.pop()!;
  const hand = room.hands[playerId] ?? [];
  const hands = { ...room.hands, [playerId]: [...hand, drawn] };
  const opponentId = otherPlayer(room.players, playerId).id;

  return {
    room: {
      ...room,
      hands,
      deck: remainingDeck,
      discard,
      turn: opponentId,
    },
    drawn,
  };
}

export function rematchCrazy8s(room: Crazy8sRoom): Crazy8sRoom {
  if (room.status !== 'finished') throw new Error('Game is not finished');
  const { deck, discard, hands, currentColor } = initGame(room.players);
  return { ...room, deck, discard, hands, currentColor, turn: room.players[0].id, status: 'playing', winner: null };
}
