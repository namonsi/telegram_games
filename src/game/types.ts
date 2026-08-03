export type Player = {
  id: string;
  firstName: string;
  username?: string;
};

export type Hint = 'higher' | 'lower' | 'hit';

export type Guess = {
  playerId: string;
  value: number;
  hint: Hint;
};

export type Room = {
  id: string;
  range: { min: number; max: number };
  players: [Player, Player];
  targets: Record<string, number | undefined>;
  turn: string;
  history: Guess[];
  winner: string | null;
};
