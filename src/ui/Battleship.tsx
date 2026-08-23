import { useState } from 'react';
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
  const [current, setCurrent] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const myShips = room.ships[meId];
  const other = room.players.find((p) => p.id !== meId);
  const needSize = SHIP_SIZES[placed.length];
  const allStaged = placed.length === SHIP_SIZES.length && current.length === needSize;

  const tap = (cell: number) => {
    if (current.includes(cell)) return setCurrent(current.filter((c) => c !== cell));
    if (placed.flat().includes(cell)) return;
    if (current.length >= needSize) return;
    setCurrent([...current, cell]);
    setError(null);
  };

  const commitShip = async () => {
    const all = [...placed, current];
    setError(null);
    try {
      onUpdate(await api.placeShips(room.id, all));
    } catch (e) {
      setError((e as Error).message);
      setPlaced([]);
      setCurrent([]);
    }
    setBusy(false);
  };

  if (myShips || (!other && placed.length === SHIP_SIZES.length - 1 && current.length === needSize)) {
    const ready = Boolean(myShips);
    return (
      <div className="screen">
        <h1>Battleship</h1>
        {!ready ? (
          <>
            <p className="muted">Fleet ready! Invite your partner, then deploy.</p>
            <button onClick={commitShip} disabled={busy}>
              {busy ? 'Deploying…' : 'Deploy fleet'}
            </button>
          </>
        ) : (
          <p className="muted">Ships deployed. Waiting for {other?.firstName ?? 'your partner'} to place theirs…</p>
        )}
        {!other && <PartnerWait room={room} />}
        <BoardView ships={myShips ?? [...placed, current]} />
      </div>
    );
  }

  return (
    <div className="screen">
      <h1>Battleship</h1>
      <p className="muted">
        Place your ships — sizes {SHIP_SIZES.join(', ')}. Now placing the {needSize}-cell ship:{' '}
        {current.length}/{needSize} cells tapped.
      </p>
      <BoardView ships={placed} onCellTap={tap} />
      {error && <p className="error">{error}</p>}
      {allStaged && (
        <button onClick={commitShip}>
          {!other ? 'Deploy fleet' : 'Deploy fleet & start'}
        </button>
      )}
      {(current.length > 0 || placed.length > 0) && (
        <button
          className="secondary"
          onClick={() => {
            if (current.length) setCurrent([]);
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

function BoardView({
  ships,
  onCellTap,
  incomingShots,
}: {
  ships: number[][];
  onCellTap?: (cell: number) => void;
  incomingShots?: Map<number, boolean>;
}) {
  const shipCells = new Set(ships.flat());
  return (
    <div className="board-grid">
      {Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, cell) => {
        const inShip = shipCells.has(cell);
        const shot = incomingShots?.get(cell);
        return (
          <button
            key={cell}
            className={`cell ${inShip ? 'ship' : ''} ${shot === true ? 'hit' : ''} ${shot === false ? 'miss' : ''}`}
            onClick={() => onCellTap?.(cell)}
            disabled={!onCellTap}
            aria-label={`Cell ${cell}`}
          >
            {shot === true ? '💥' : shot === false ? '💧' : inShip ? '🚢' : ''}
          </button>
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
