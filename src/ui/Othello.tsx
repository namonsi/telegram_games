import { useState } from 'react';
import type { OthelloRoom } from '../game/types';
import { api } from '../api';
import { GRID_SIZE, PLAYER_BLACK, PLAYER_WHITE } from '../game/othello';
import SocialBar from './SocialBar';

type Props = {
  meId: string;
  room: OthelloRoom;
  onUpdate: (room: OthelloRoom) => void;
};

export default function Othello({ meId, room, onUpdate }: Props) {
  const [busy, setBusy] = useState(false);

  const other = room.players.find((p) => p.id !== meId);
  const myTurn = room.turn === meId;

  const { black, white } = room.board.reduce(
    (acc, v) => {
      if (v === PLAYER_BLACK) acc.black++;
      else if (v === PLAYER_WHITE) acc.white++;
      return acc;
    },
    { black: 0, white: 0 },
  );

  const place = async (cell: number) => {
    if (!myTurn || busy || !room.validMoves.includes(cell)) return;
    setBusy(true);
    try {
      onUpdate(await api.placeOthello(room.id, cell));
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const getCellContent = (cell: number) => {
    const v = room.board[cell];
    if (v === PLAYER_BLACK) return '⚫';
    if (v === PLAYER_WHITE) return '⚪';
    if (room.validMoves.includes(cell) && myTurn) return '🟢';
    return null;
  };

  if (room.status === 'finished') {
    const isWinner = room.winner === meId;
    return (
      <div className="screen">
        <h1>Othello</h1>
        <p className="muted">
          {room.winner ? (isWinner ? '🎉 You win!' : `${other?.firstName} wins!`) : '🤝 Draw — board full'}
        </p>
        <div className="board-meta">⚫ {black} — ⚪ {white}</div>
        <div className="othello-board" style={{ pointerEvents: 'none' }}>
          {room.board.map((v, i) => (
            <div key={i} className="othello-cell">
              {v === PLAYER_BLACK ? '⚫' : v === PLAYER_WHITE ? '⚪' : ''}
            </div>
          ))}
        </div>
        <SocialBar room={room} onUpdate={onUpdate} />
      </div>
    );
  }

  return (
    <div className="screen">
      <h1>Othello</h1>
      <p className="muted">
        ⚫ {room.players[0].firstName} — ⚪ {room.players[1]?.firstName ?? 'Partner'}
      </p>
      <p className="muted">Score: ⚫ {black} — ⚪ {white}</p>

      <SocialBar room={room} onUpdate={onUpdate} />

      <div className="othello-board">
        {Array.from({ length: GRID_SIZE }).map((_, r) => (
          <div key={r} className="othello-row">
            {Array.from({ length: GRID_SIZE }).map((_, c) => {
              const cell = r * GRID_SIZE + c;
              const content = getCellContent(cell);
              const isValid = content === '🟢';
              return (
                <button
                  key={cell}
                  className={`othello-cell ${isValid ? 'valid' : ''}`}
                  onClick={() => place(cell)}
                  disabled={!myTurn || busy || !room.validMoves.includes(cell)}
                  aria-label={content ? `Cell ${r + 1},${c + 1}: ${content}` : `Cell ${r + 1},${c + 1}: empty`}
                >
                  {content}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {myTurn ? (
        <p className="muted">Your turn — tap a green cell to place your piece</p>
      ) : (
        <p className="muted">Waiting for {other?.firstName ?? 'your partner'}…</p>
      )}
    </div>
  );
}