import { useRef, useState } from 'react';
import type { BattleshipRoom } from '../game/types';
import { api } from '../api';
import { GRID_SIZE, SHIP_SIZES } from '../game/battleship';
import { GameOver, PartnerWait, useWinConfetti } from './shared';
import SocialBar from './SocialBar';

type Props = {
  meId: string;
  room: BattleshipRoom;
  onUpdate: (room: BattleshipRoom) => void;
};

export default function Battleship({ meId, room, onUpdate }: Props) {
  switch (room.status) {
    case 'waiting':
      return <PartnerWait room={room} />;
    case 'setup':
      return <Placement meId={meId} room={room} onUpdate={onUpdate} />;
    case 'playing':
      return <Battle meId={meId} room={room} onUpdate={onUpdate} />;
    case 'finished':
      return <Result meId={meId} room={room} onUpdate={onUpdate} />;
  }
}

function Placement({ meId, room, onUpdate }: Props) {
  const [placed, setPlaced] = useState<number[][]>([]);
  const [draft, setDraft] = useState<number[]>([]);
  const draftRef = useRef<number[]>([]);
  const draggingRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const myShips = room.ships[meId];
  const other = room.players.find((p) => p.id !== meId);
  const needSize = SHIP_SIZES[placed.length] ?? 0;
  const allStaged = placed.length === SHIP_SIZES.length - 1 && draft.length === needSize;

  const setBoth = (cells: number[]) => {
    draftRef.current = cells;
    setDraft(cells);
  };

  const cellFromPoint = (x: number, y: number): number | null => {
    const el = document.elementFromPoint(x, y) as HTMLElement | null;
    const raw = el?.dataset?.cell;
    return raw === undefined || raw === null ? null : Number(raw);
  };

  const onDown = (e: React.PointerEvent) => {
    const cell = cellFromPoint(e.clientX, e.clientY);
    if (cell === null || placed.flat().includes(cell)) return;
    draggingRef.current = true;
    setBoth([cell]);
    setError(null);
  };

  const onMove = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    const cell = cellFromPoint(e.clientX, e.clientY);
    if (cell === null) return;
    const prev = draftRef.current;
    if (prev.includes(cell)) return;
    const start = prev[0];
    const sr = Math.floor(start / GRID_SIZE);
    const sc = start % GRID_SIZE;
    const r = Math.floor(cell / GRID_SIZE);
    const c = cell % GRID_SIZE;
    if (r !== sr && c !== sc) return; // straight lines only
    const cells: number[] = [];
    if (r === sr) {
      for (let i = Math.min(sc, c); i <= Math.max(sc, c); i++) cells.push(sr * GRID_SIZE + i);
    } else {
      for (let i = Math.min(sr, r); i <= Math.max(sr, r); i++) cells.push(i * GRID_SIZE + sc);
    }
    if (cells.length > needSize) return;
    if (cells.some((x) => placed.flat().includes(x))) return;
    setBoth(cells);
  };

  const onUp = () => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    const cells = draftRef.current;
    if (cells.length === needSize) {
      const next = [...placed, cells];
      setPlaced(next);
      setBoth([]);
      setError(null);
      if (next.length === SHIP_SIZES.length && other) void commit(next);
    } else {
      setError(`Ships must be straight lines — drag across exactly ${needSize} cells`);
    }
  };

  const commit = async (all: number[][]) => {
    setBusy(true);
    setError(null);
    try {
      onUpdate(await api.placeShips(room.id, all));
    } catch (e) {
      setError((e as Error).message);
      setPlaced([]);
      setBoth([]);
    } finally {
      setBusy(false);
    }
  };

  if (myShips || (!other && placed.length === SHIP_SIZES.length - 1 && draft.length === needSize)) {
    const ready = Boolean(myShips);
    return (
      <div className="screen">
        <h1>Battleship</h1>
        {!ready ? (
          <>
            <p className="muted">Fleet ready! Invite your partner, then deploy.</p>
            <button onClick={() => commit([...placed, draft])} disabled={busy}>
              {busy ? 'Deploying…' : 'Deploy fleet'}
            </button>
          </>
        ) : (
          <p className="muted">Ships deployed. Waiting for {other?.firstName ?? 'your partner'} to place theirs…</p>
        )}
        {!other && <PartnerWait room={room} />}
        <BoardView ships={myShips ?? [...placed, draft]} />
      </div>
    );
  }

  return (
    <div className="screen">
      <h1>Battleship</h1>
      <p className="muted">
        Place your ships — sizes {SHIP_SIZES.join(', ')}. Now the {needSize}-cell ship:{' '}
        <b>press a cell and drag</b> across {needSize} in a line.
      </p>
      <div
        className="board-grid placing"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onContextMenu={(e) => e.preventDefault()}
      >
        {Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, cell) => {
          const inShip = placed.flat().includes(cell);
          const inDraft = draft.includes(cell);
          return (
            <div
              key={cell}
              data-cell={cell}
              className={`cell ${inShip ? 'ship' : ''} ${inDraft ? 'draft' : ''}`}
              aria-label={`Cell ${cell}`}
            >
              {inDraft ? '🚢' : inShip ? '🚢' : ''}
            </div>
          );
        })}
      </div>
      {error && <p className="error">{error}</p>}
      {allStaged && !other && (
        <button onClick={() => commit([...placed, draft])} disabled={busy}>
          {busy ? 'Deploying…' : 'Deploy fleet'}
        </button>
      )}
      {(draft.length > 0 || placed.length > 0) && (
        <button
          className="secondary"
          onClick={() => {
            if (draft.length) setBoth([]);
            else setPlaced(placed.slice(0, -1));
          }}
        >
          Undo last
        </button>
      )}
    </div>
  );
}

function Battle({ meId, room, onUpdate }: Props) {
  const [error, setError] = useState<string | null>(null);

  const other = room.players.find((p) => p.id !== meId);
  const myTurn = room.turn === meId;
  const enemyId = other?.id ?? '';

  const fire = async (cell: number) => {
    if (!myTurn) return;
    setError(null);
    try {
      onUpdate(await api.fire(room.id, cell));
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const myShotMap = new Map(room.shots.filter((s) => s.byId === meId).map((s) => [s.cell, s.hit]));
  const theirShotMap = new Map(room.shots.filter((s) => s.byId === enemyId).map((s) => [s.cell, s.hit]));
  const hitsOnEnemy = [...myShotMap.values()].filter(Boolean).length;

  return (
    <div className="screen">
      <h1>Battleship</h1>
      <p className="muted">
        Hits landed: {hitsOnEnemy}/9 · Turn: {myTurn ? 'yours 🎯' : `${other?.firstName ?? 'partner'}'s`}
      </p>

      <SocialBar room={room} onUpdate={onUpdate} />

      <h3>Radar — tap to fire</h3>
      <div className="board-grid">
        {Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, cell) => {
          const shot = myShotMap.get(cell);
          return (
            <button
              key={cell}
              className={`cell ${shot === true ? 'hit' : ''} ${shot === false ? 'miss' : ''}`}
              onClick={() => fire(cell)}
              disabled={!myTurn || shot !== undefined}
              aria-label={`Fire at ${cell}`}
            >
              {shot === true ? '💥' : shot === false ? '💧' : ''}
            </button>
          );
        })}
      </div>

      <h3>Your fleet</h3>
      <BoardView ships={room.ships[meId] ?? []} incomingShots={theirShotMap} />
      {error && <p className="error">{error}</p>}
    </div>
  );
}

function BoardView({ ships, incomingShots }: { ships: number[][]; incomingShots?: Map<number, boolean> }) {
  const shipCells = new Set(ships.flat());
  return (
    <div className="board-grid">
      {Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, cell) => {
        const inShip = shipCells.has(cell);
        const shot = incomingShots?.get(cell);
        return (
          <div key={cell} className={`cell ${inShip ? 'ship' : ''} ${shot === true ? 'hit' : ''} ${shot === false ? 'miss' : ''}`}>
            {shot === true ? '💥' : shot === false ? '💧' : inShip ? '🚢' : ''}
          </div>
        );
      })}
    </div>
  );
}

function Result({ meId, room, onUpdate }: Props) {
  useWinConfetti(room.id);
  const iWon = room.winner === meId;
  return (
    <>
      <GameOver
        room={room}
        meId={meId}
        onUpdate={onUpdate}
        emoji={iWon ? '🏆' : '🌊'}
        headline={iWon ? 'You sank them all!' : `${room.players.find((p) => p.id === room.winner)?.firstName ?? 'Partner'} wins!`}
      />
      <div className="screen">
        <h3>Final boards</h3>
        {room.players.map((p) => (
          <div key={p.id}>
            <p className="muted">{p.id === meId ? 'Your fleet' : `${p.firstName}'s fleet`}</p>
            <BoardView ships={room.ships[p.id] ?? []} />
          </div>
        ))}
      </div>
    </>
  );
}
