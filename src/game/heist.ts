import type { HeistRoom, Player } from './types.js';

const GRID_SIZE = 6;
const TOTAL_LOOT = 3;
const MIN_WALLS = 8;
const MAX_WALLS = 10;
const PATROL_MIN = 3;
const PATROL_MAX = 5;

export const PRESET_MESSAGES = [
  'Go!',
  'Watch out!',
  'Not that way!',
  'Hurry!',
  'Almost there!',
  'I see something.',
  'Need help?',
  'Be careful!',
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

function cellToRC(cell: number): [number, number] {
  return [Math.floor(cell / GRID_SIZE), cell % GRID_SIZE];
}

function rcToCell(row: number, col: number): number {
  return row * GRID_SIZE + col;
}

function neighbors(cell: number): number[] {
  const [r, c] = cellToRC(cell);
  const out: number[] = [];
  if (r > 0) out.push(rcToCell(r - 1, c));
  if (r < GRID_SIZE - 1) out.push(rcToCell(r + 1, c));
  if (c > 0) out.push(rcToCell(r, c - 1));
  if (c < GRID_SIZE - 1) out.push(rcToCell(r, c + 1));
  return out;
}

function floodFill(grid: number[][], start: number): boolean {
  const flat = grid.flat();
  const visited = new Set<number>();
  const stack = [start];
  while (stack.length) {
    const cell = stack.pop()!;
    if (visited.has(cell)) continue;
    visited.add(cell);
    if (flat[cell] === 1) continue;
    for (const n of neighbors(cell)) {
      if (!visited.has(n) && flat[n] !== 1) stack.push(n);
    }
  }
  for (let i = 0; i < flat.length; i++) {
    if (flat[i] !== 1 && !visited.has(i)) return false;
  }
  return true;
}

function generateGrid(): number[][] {
  const flat = Array.from({ length: GRID_SIZE * GRID_SIZE }, () => 0);

  // place 3 loot at random floor cells (skip cell 0 — thief start)
  const floorCells = shuffle(flat.map((_, i) => i).filter((i) => i !== 0));
  const lootCells = floorCells.splice(0, TOTAL_LOOT);
  for (const c of lootCells) flat[c] = 2;

  // place exit at a random floor cell
  const exitCell = floorCells.shift()!;
  flat[exitCell] = 3;

  // place walls ensuring connectivity from cell 0
  const wallCandidates = shuffle(floorCells);
  let wallsPlaced = 0;
  const targetWalls = MIN_WALLS + Math.floor(Math.random() * (MAX_WALLS - MIN_WALLS + 1));
  for (const c of wallCandidates) {
    if (wallsPlaced >= targetWalls) break;
    const trial = [...flat];
    trial[c] = 1;
    const grid = toGrid(trial);
    if (floodFill(grid, 0)) {
      flat[c] = 1;
      wallsPlaced++;
    }
  }

  return toGrid(flat);
}

function toGrid(flat: number[]): number[][] {
  const grid: number[][] = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    grid.push(flat.slice(r * GRID_SIZE, (r + 1) * GRID_SIZE));
  }
  return grid;
}

function generatePatrols(grid: number[][]): number[][] {
  const flat = grid.flat();
  const walkable = flat.map((_, i) => i).filter((i) => flat[i] !== 1);

  const patrols: number[][] = [];
  for (let g = 0; g < 2; g++) {
    const patrolLen = PATROL_MIN + Math.floor(Math.random() * (PATROL_MAX - PATROL_MIN + 1));
    const start = walkable[Math.floor(Math.random() * walkable.length)];
    const patrol: number[] = [start];
    const used = new Set([start]);

    for (let step = 1; step < patrolLen; step++) {
      const last = patrol[patrol.length - 1]!;
      const adj = neighbors(last).filter((n) => flat[n] !== 1 && !used.has(n));
      if (adj.length === 0) break;
      const next = adj[Math.floor(Math.random() * adj.length)];
      patrol.push(next);
      used.add(next);
    }
    patrols.push(patrol);
  }
  return patrols;
}

export function createHeist(id: string, creator: Player): HeistRoom {
  return {
    id,
    kind: 'heist',
    players: [creator],
    turn: '',
    winner: null,
    status: 'waiting',
    reaction: null,
    chat: null,
    stats: { games: 0, wins: {} },
    grid: [],
    guardPatrols: [],
    guardPositions: [],
    thiefPosition: 0,
    lootCollected: 0,
    totalLoot: TOTAL_LOOT,
    vaultRunnerId: '',
    securityId: '',
    messages: [],
  };
}

export function startHeist(room: HeistRoom): HeistRoom {
  const grid = generateGrid();
  const guardPatrols = generatePatrols(grid);
  const guardPositions = guardPatrols.map((p) => p[0]!);
  const vaultRunnerId = room.players[0]!.id;
  return {
    ...room,
    grid,
    guardPatrols,
    guardPositions,
    thiefPosition: 0,
    lootCollected: 0,
    vaultRunnerId,
    securityId: room.players[1]!.id,
    status: 'playing',
    turn: vaultRunnerId,
    winner: null,
    messages: [],
    stats: { ...room.stats, games: room.stats.games + 1 },
  };
}

function checkCatch(room: HeistRoom): string | null {
  for (const gp of room.guardPositions) {
    if (gp === room.thiefPosition) return room.securityId;
  }
  return null;
}

function checkLoot(room: HeistRoom, cell: number): number {
  const flat = room.grid.flat();
  if (flat[cell] === 2) return room.lootCollected + 1;
  return room.lootCollected;
}

function checkWin(room: HeistRoom): boolean {
  const flat = room.grid.flat();
  return flat[room.thiefPosition] === 3 && room.lootCollected >= room.totalLoot;
}

export function moveThief(
  room: HeistRoom,
  playerId: string,
  direction: 'up' | 'down' | 'left' | 'right',
): { room: HeistRoom } {
  if (room.status !== 'playing') throw new Error('Game not in progress');
  if (room.turn !== room.vaultRunnerId) throw new Error('Not your turn');
  if (playerId !== room.vaultRunnerId) throw new Error('You are not the vault runner');

  const [r, c] = cellToRC(room.thiefPosition);
  let nr = r, nc = c;
  if (direction === 'up') nr--;
  else if (direction === 'down') nr++;
  else if (direction === 'left') nc--;
  else if (direction === 'right') nc++;

  if (nr < 0 || nr >= GRID_SIZE || nc < 0 || nc >= GRID_SIZE) {
    return { room };
  }

  const newCell = rcToCell(nr, nc);
  const flat = room.grid.flat();
  if (flat[newCell] === 1) return { room };

  let updated = { ...room, thiefPosition: newCell };
  updated.lootCollected = checkLoot(updated, newCell);

  if (updated.lootCollected > room.lootCollected) {
    const [lr, lc] = cellToRC(newCell);
    const newGrid = updated.grid.map((row) => [...row]);
    newGrid[lr]![lc] = 0;
    updated = { ...updated, grid: newGrid };
  }

  if (checkWin(updated)) {
    return { room: { ...updated, status: 'finished', winner: room.vaultRunnerId, turn: '' } };
  }

  if (checkCatch(updated)) {
    return { room: { ...updated, status: 'finished', winner: room.securityId, turn: '' } };
  }

  return { room: { ...updated, turn: room.securityId } };
}

export function moveGuard(
  room: HeistRoom,
  playerId: string,
  guardIndex: number,
): { room: HeistRoom } {
  if (room.status !== 'playing') throw new Error('Game not in progress');
  if (room.turn !== room.securityId) throw new Error('Not your turn');
  if (playerId !== room.securityId) throw new Error('You are not security');
  if (guardIndex < 0 || guardIndex >= room.guardPatrols.length) throw new Error('Invalid guard');

  const patrol = room.guardPatrols[guardIndex]!;
  const curIdx = patrol.indexOf(room.guardPositions[guardIndex]!);
  const nextIdx = (curIdx + 1) % patrol.length;
  const newPositions = [...room.guardPositions];
  newPositions[guardIndex] = patrol[nextIdx]!;

  const updated = { ...room, guardPositions: newPositions };

  if (checkCatch(updated)) {
    return { room: { ...updated, status: 'finished', winner: room.securityId, turn: '' } };
  }

  return { room: { ...updated, turn: room.vaultRunnerId } };
}

export function sendHeistMessage(
  room: HeistRoom,
  playerId: string,
  text: string,
): { room: HeistRoom } {
  if (room.status !== 'playing') throw new Error('Game not in progress');
  if (!PRESET_MESSAGES.includes(text)) throw new Error('Invalid message');
  return {
    room: {
      ...room,
      messages: [...room.messages, { from: playerId, text, at: Date.now() }],
    },
  };
}

export function rematchHeist(room: HeistRoom): HeistRoom {
  const fresh = startHeist({
    ...room,
    players: room.players,
    status: 'waiting',
  });
  return { ...fresh, turn: fresh.players[0]!.id };
}
