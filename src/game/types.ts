export type Player = {
  id: string;
  firstName: string;
  telegram: { tgId: number; username?: string; photoUrl?: string };
};

export type Hint = 'higher' | 'lower' | 'hit';

export type Guess = {
  playerId: string;
  value: number;
  hint: Hint;
};

export type RoomStatus = 'waiting' | 'setup' | 'playing' | 'finished';

export type Reaction = { emoji: string; expiresAt: number };

export type Chat = { text: string; sender: string; expiresAt: number };

export type PairStats = { games: number; wins: Record<string, number> };

export type Room = {
  id: string;
  range: { min: number; max: number };
  players: Player[];
  targets: Record<string, number | undefined>;
  turn: string;
  history: Guess[];
  winner: string | null;
  status: RoomStatus;
  reaction: Reaction | null;
  chat: Chat | null;
  stats: PairStats;
};
