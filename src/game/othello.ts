import type { OthelloRoom, Player } from './types.js';

export const GRID_SIZE = 8;
export const TOTAL_CELLS = GRID_SIZE * GRID_SIZE;
export const PLAYER_BLACK = 1;
export const PLAYER_WHITE = -1;

const DIRECTIONS = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1],           [0, 1],
  [1, -1],  [1, 0],  [1, 1],
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

function getFlippable(board: number[], cell: number, player: number): number[] {
  if (board[cell] !== 0) return [];
  const [r, c] = indexToCoord(cell);
  const flips: number[] = [];

  for (const [dr, dc] of DIRECTIONS) {
    let nr = r + dr;
    let nc = c + dc;
    const line: number[] = [];

    while (isValidCoord(nr, nc)) {
      const idx = coordToIndex(nr, nc);
      const val = board[idx];
      if (val === 0) break;
      if (val === player) {
        if (line.length > 0) flips.push(...line);
        break;
      }
      line.push(idx);
      nr += dr;
      nc += dc;
    }
  }
  return flips;
}

export function getValidMoves(board: number[], player: number): number[] {
  const moves: number[] = [];
  for (let i = 0; i < TOTAL_CELLS; i++) {
    if (getFlippable(board, i, player).length > 0) moves.push(i);
  }
  return moves;
}

function hasValidMove(board: number[], player: number): boolean {
  for (let i = 0; i < TOTAL_CELLS; i++) {
    if (board[i] === 0 && getFlippable(board, i, player).length > 0) return true;
  }
  return false;
}

function countPieces(board: number[]): { black: number; white: number } {
  let black = 0, white = 0;
  for (const v of board) {
    if (v === PLAYER_BLACK) black++;
    else if (v === PLAYER_WHITE) white++;
  }
  return { black, white };
}

export function createOthello(id: string, creator: Player): OthelloRoom {
  const board = new Array<number>(TOTAL_CELLS).fill(0);
  const mid = GRID_SIZE / 2;
  board[coordToIndex(mid - 1, mid - 1)] = PLAYER_WHITE;
  board[coordToIndex(mid, mid)] = PLAYER_WHITE;
  board[coordToIndex(mid - 1, mid)] = PLAYER_BLACK;
  board[coordToIndex(mid, mid - 1)] = PLAYER_BLACK;

  return {
    id,
    kind: 'othello',
    players: [creator],
    turn: '',
    board,
    validMoves: getValidMoves(board, PLAYER_BLACK),
    winner: null,
    status: 'waiting',
    reaction: null,
    chat: null,
    stats: { games: 0, wins: {} },
  };
}

export function placePiece(
  room: OthelloRoom,
  playerId: string,
  cell: number,
): { room: OthelloRoom; flips: number[] } {
  if (room.status !== 'playing') throw new Error('Game is not in progress');
  if (room.turn !== playerId) throw new Error('Not your turn');

  const playerIdx = room.players.findIndex((p) => p.id === playerId);
  if (playerIdx === -1) throw new Error('Player not in room');
  const player = playerIdx === 0 ? PLAYER_BLACK : PLAYER_WHITE;

  const flips = getFlippable(room.board, cell, player);
  if (flips.length === 0) throw new Error('Invalid move');

  const board = [...room.board];
  board[cell] = player;
  for (const f of flips) board[f] = player;

  const opponent = PLAYER_BLACK === player ? PLAYER_WHITE : PLAYER_BLACK;
  const opponentHasMove = hasValidMove(board, opponent);

  const next: OthelloRoom = {
    ...room,
    board,
    validMoves: opponentHasMove ? getValidMoves(board, opponent) : getValidMoves(board, player),
    turn: opponentHasMove ? room.players[1 - playerIdx].id : playerId,
    stats: { ...room.stats, games: room.stats.games + 1 },
  };

  // check if game ended (both players have no moves)
  const currentHasMove = hasValidMove(board, player);
  const opponentHasMove2 = hasValidMove(board, opponent);
  if (!currentHasMove && !opponentHasMove2) {
    const { black, white } = countPieces(board);
    const winner = black > white ? room.players[0].id : white > black ? room.players[1].id : null;
    next.status = 'finished';
    next.winner = winner;
    next.stats = { ...next.stats, wins: winner ? { ...next.stats.wins, [winner]: (next.stats.wins[winner] ?? 0) + 1 } : next.stats.wins };
  }

  return { room: next, flips };
}

export function rematchOthello(room: OthelloRoom): OthelloRoom {
  if (room.status !== 'finished') throw new Error('Game is not finished');
  const board = new Array<number>(TOTAL_CELLS).fill(0);
  const mid = GRID_SIZE / 2;
  board[coordToIndex(mid - 1, mid - 1)] = PLAYER_WHITE;
  board[coordToIndex(mid, mid)] = PLAYER_WHITE;
  board[coordToIndex(mid - 1, mid)] = PLAYER_BLACK;
  board[coordToIndex(mid, mid - 1)] = PLAYER_BLACK;
  return {
    ...room,
    board,
    validMoves: getValidMoves(board, PLAYER_BLACK),
    turn: room.players[0].id,
    winner: null,
    status: 'playing',
  };
}