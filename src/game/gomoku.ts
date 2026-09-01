import type { GomokuRoom, Player } from './types.js';

export const GRID_SIZE = 15;
export const TOTAL_CELLS = GRID_SIZE * GRID_SIZE;
export const PLAYER_BLACK = 1;
export const PLAYER_WHITE = -1;
export const WIN_LENGTH = 5;

const DIRECTIONS = [
  [0, 1],   // horizontal
  [1, 0],   // vertical
  [1, 1],   // diagonal down-right
  [1, -1],  // diagonal down-left
];

function indexToCoord(idx: number): [number, number] {
  return [Math.floor(idx / GRID_SIZE), idx % GRID_SIZE];
}

function coordToIndex(r: number, c: number): number {
  return r * GRID_SIZE + c;
}

function isValidCoord(r: number, c: number): boolean {
  return r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE;
}

function countLine(board: number[], r: number, c: number, dr: number, dc: number, player: number): number {
  let count = 0;
  let nr = r + dr;
  let nc = c + dc;
  while (isValidCoord(nr, nc) && board[coordToIndex(nr, nc)] === player) {
    count++;
    nr += dr;
    nc += dc;
  }
  return count;
}

function checkWin(board: number[], cell: number, player: number): boolean {
  const [r, c] = indexToCoord(cell);
  for (const [dr, dc] of DIRECTIONS) {
    const total = 1 + countLine(board, r, c, dr, dc, player) + countLine(board, r, c, -dr, -dc, player);
    if (total >= WIN_LENGTH) return true;
  }
  return false;
}

export function getValidMoves(board: number[]): number[] {
  const moves: number[] = [];
  for (let i = 0; i < TOTAL_CELLS; i++) {
    if (board[i] === 0) moves.push(i);
  }
  return moves;
}

export function createGomoku(id: string, creator: Player): GomokuRoom {
  return {
    id,
    kind: 'gomoku',
    players: [creator],
    turn: '',
    board: new Array<number>(TOTAL_CELLS).fill(0),
    validMoves: getValidMoves(new Array<number>(TOTAL_CELLS).fill(0)),
    winner: null,
    status: 'waiting',
    reaction: null,
    chat: null,
    stats: { games: 0, wins: {} },
  };
}

export function placeStone(
  room: GomokuRoom,
  playerId: string,
  cell: number,
): { room: GomokuRoom } {
  if (room.status !== 'playing') throw new Error('Game is not in progress');
  if (room.turn !== playerId) throw new Error('Not your turn');
  if (room.board[cell] !== 0) throw new Error('Cell is occupied');

  const playerIdx = room.players.findIndex((p) => p.id === playerId);
  if (playerIdx === -1) throw new Error('Player not in room');
  const player = playerIdx === 0 ? PLAYER_BLACK : PLAYER_WHITE;

  const board = [...room.board];
  board[cell] = player;

  const next: GomokuRoom = {
    ...room,
    board,
    validMoves: getValidMoves(board),
    turn: room.players[1 - playerIdx].id,
    stats: { ...room.stats, games: room.stats.games + 1 },
  };

  if (checkWin(board, cell, player)) {
    next.status = 'finished';
    next.winner = playerId;
    next.stats = { ...next.stats, wins: { ...next.stats.wins, [playerId]: (next.stats.wins[playerId] ?? 0) + 1 } };
  } else if (getValidMoves(board).length === 0) {
    next.status = 'finished';
    next.winner = null;
  }

  return { room: next };
}

export function rematchGomoku(room: GomokuRoom): GomokuRoom {
  if (room.status !== 'finished') throw new Error('Game is not finished');
  return {
    ...room,
    board: new Array<number>(TOTAL_CELLS).fill(0),
    validMoves: getValidMoves(new Array<number>(TOTAL_CELLS).fill(0)),
    turn: room.players[0].id,
    winner: null,
    status: 'playing',
  };
}
