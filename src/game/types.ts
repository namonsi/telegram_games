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

// solved counts co-op mystery cases cracked together
export type PairStats = { games: number; wins: Record<string, number>; solved?: number };

export type Range = { min: number; max: number };

type Base = {
  id: string;
  players: Player[];
  /** who acts next; unused ('' ) for simultaneous games like quiz/twenty roles */
  turn: string;
  /** playerId, 'team' for co-op mystery solves, null = draw/cold case */
  winner: string | null;
  status: RoomStatus;
  reaction: Reaction | null;
  chat: Chat | null;
  stats: PairStats;
};

export type NumberRoom = Base & {
  kind: 'number';
  range: Range;
  targets: Record<string, number>;
  history: Guess[];
};

export type KnowMePick = { q: string; a: string };
export type KnowMeLogEntry = { byId: string; text: string; correct: boolean };

export type KnowMeRoom = Base & {
  kind: 'knowme';
  /** per player: their questions + secret answers */
  picks: Record<string, KnowMePick[]>;
  /** global round 0..(ROUNDS*2-1); even round -> players[0] is asker */
  round: number;
  log: KnowMeLogEntry[];
};

export type Shot = { byId: string; cell: number; hit: boolean };

export type BattleshipRoom = Base & {
  kind: 'battleship';
  /** per player: ships as lists of grid cells (r * GRID_SIZE + c); never send opponent's to client */
  ships: Record<string, number[][]>;
  shots: Shot[];
};

export type Verdict = 'yes' | 'no' | 'maybe';
export type TwentyEntry = { q: string; a: Verdict };

export type TwentyRoom = Base & {
  kind: 'twenty';
  answererId: string;
  /** hidden from the asker until the game ends */
  secret: string;
  /** questions asked + wrong final guesses, out of TWENTY_MAX */
  used: number;
  question: string | null;
  log: TwentyEntry[];
};

export type Suspect = { id: string; name: string; blurb: string };

export type MysteryRoom = Base & {
  kind: 'mystery';
  /** index into the SERVER-ONLY case file; culprit never stored here */
  caseIndex: number;
  title: string;
  story: string;
  suspects: Suspect[];
  revealed: number;
  clueCount: number;
  strikes: number;
  /** already-revealed clue texts (persisted so both clients see them) */
  shown: string[];
  /** filled by the API layer when the case ends */
  solution?: string;
};

export type QuizResult = { q: string; options: string[]; correct: number; picks: Record<string, number> };

export type QuizRoom = Base & {
  kind: 'quiz';
  asked: number[];
  /** index into the SERVER-ONLY bank; view layer inlines currentQ for the client */
  current: number;
  picks: Record<string, number>;
  scores: Record<string, number>;
  target: number;
  results: QuizResult[];
  /** view-only, injected by sanitize, never persisted */
  currentQ?: { q: string; options: string[] };
};

export type Room =
  | NumberRoom
  | KnowMeRoom
  | BattleshipRoom
  | TwentyRoom
  | MysteryRoom
  | QuizRoom;

export type GameKind = Room['kind'];
