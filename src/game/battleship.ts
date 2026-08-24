import type { BattleshipRoom, Player } from './types.js';
import { otherPlayer } from './engine.js';

export const GRID_SIZE = 5;
export const SHIP_SIZES = [4, 3, 2];

export function createBattleship(id: string, creator: Player): BattleshipRoom {
  return {
    id,
    kind: 'battleship',
    players: [creator],
    turn: '',
    ships: {},
    shots: [],
    winner: null,
    status: 'waiting',
    reaction: null,
    chat: null,
    stats: { games: 0, wins: {} },
  };
}

const inGrid = (cell: number) => Number.isInteger(cell) && cell >= 0 && cell < GRID_SIZE * GRID_SIZE;

/** ship cells must form one straight contiguous line */
function isStraightLine(cells: number[]): boolean {
  if (cells.length < 2) return true;
  const rows = cells.map((c) => Math.floor(c / GRID_SIZE));
  const cols = cells.map((c) => c % GRID_SIZE);
  const sameRow = rows.every((r) => r === rows[0]);
  const sameCol = cols.every((c) => c === cols[0]);
  if (!sameRow && !sameCol) return false;
  const axis = sameRow ? cols : rows;
  const sortedAxis = [...axis].sort((a, b) => a - b);
  return sortedAxis.every((v, i) => i === 0 || v === sortedAxis[i - 1] + 1);
}

export function placeShips(room: BattleshipRoom, playerId: string, ships: number[][]): BattleshipRoom {
  if (room.status !== 'setup' && room.status !== 'waiting') throw new Error('Not in setup');
  const sorted = ships.map((cells) => [...cells].sort((a, b) => a - b));
  if (sorted.length !== SHIP_SIZES.length) throw new Error(`Place exactly ${SHIP_SIZES.length} ships`);
  if (sorted.some((cells, i) => cells.length !== SHIP_SIZES[i])) {
    throw new Error(`Ships must have sizes ${SHIP_SIZES.join(', ')}`);
  }
  if (sorted.some((cells) => !isStraightLine(cells))) throw new Error('Ships must be straight lines');
  const seen = new Set<number>();
  for (const cells of sorted) {
    for (const cell of cells) {
      if (!inGrid(cell)) throw new Error('Ship cell outside the grid');
      if (seen.has(cell)) throw new Error('Ships cannot overlap');
      seen.add(cell);
    }
  }
  const entries = { ...room.ships, [playerId]: sorted };
  const allSet = room.players.length === 2 && room.players.every((p) => entries[p.id] !== undefined);
  const next: BattleshipRoom = { ...room, ships: entries, status: allSet ? 'playing' : room.status };
  if (allSet) next.turn = room.players[0].id;
  return next;
}

function myShots(room: BattleshipRoom, playerId: string): Set<number> {
  return new Set(room.shots.filter((s) => s.byId === playerId).map((s) => s.cell));
}

export function allSunk(room: BattleshipRoom, targetId: string, shotCells: Set<number>): boolean {
  return room.ships[targetId].every((ship) => ship.every((cell) => shotCells.has(cell)));
}

export function fire(room: BattleshipRoom, playerId: string, cell: number): { room: BattleshipRoom; hit: boolean } {
  if (room.status !== 'playing') throw new Error('Game is not in progress');
  if (room.turn !== playerId) throw new Error('Not your turn');
  if (!inGrid(cell)) throw new Error('Shot outside the grid');
  if (myShots(room, playerId).has(cell)) throw new Error('You already fired there');

  const enemy = otherPlayer(room.players, playerId);
  const hit = room.ships[enemy.id].some((ship) => ship.includes(cell));
  const shots = [...room.shots, { byId: playerId, cell, hit }];
  let next: BattleshipRoom = { ...room, shots };

  if (allSunk(next, enemy.id, myShots(next, playerId))) {
    next = {
      ...next,
      status: 'finished',
      winner: playerId,
      stats: { games: next.stats.games + 1, wins: { ...next.stats.wins, [playerId]: (next.stats.wins[playerId] ?? 0) + 1 } },
    };
  } else {
    next.turn = enemy.id;
  }
  return { room: next, hit };
}

export function rematchBattleship(room: BattleshipRoom): BattleshipRoom {
  if (room.status !== 'finished') throw new Error('Game is not finished');
  return { ...room, ships: {}, shots: [], chatLog: [], winner: null, turn: '', status: 'setup' };
}
