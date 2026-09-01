import { useState } from 'react';
import type { GomokuRoom } from '../game/types';
import { api } from '../api';
import { PLAYER_BLACK, PLAYER_WHITE } from '../game/gomoku';
import SocialBar from './SocialBar';

// star points for 15x15 board (tengen + 4 corners)
const STAR_POINTS = [112, 48, 196, 208, 32];

type Props = {
  meId: string;
  room: GomokuRoom;
  onUpdate: (room: GomokuRoom) => void;
};

export default function Gomoku({ meId, room, onUpdate }: Props) {
  const [busy, setBusy] = useState(false);

  const other = room.players.find((p) => p.id !== meId);
  const myTurn = room.turn === meId;

  const place = async (cell: number) => {
    if (!myTurn || busy || room.board[cell] !== 0) return;
    setBusy(true);
    try {
      onUpdate(await api.placeGomoku(room.id, cell));
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const blackCount = room.board.filter((v) => v === PLAYER_BLACK).length;
  const whiteCount = room.board.filter((v) => v === PLAYER_WHITE).length;

  if (room.status === 'finished') {
    const isWinner = room.winner === meId;
    return (
      <div className="screen">
        <h1>Gomoku</h1>
        <p className="muted">
          {room.winner ? (isWinner ? '🎉 You win!' : `${other?.firstName} wins!`) : '🤝 Draw'}
        </p>
        <p className="muted">
          ⚫ {room.players[0].firstName} {blackCount} — {whiteCount} {room.players[1]?.firstName ?? 'Partner'} ⚪
        </p>
        <div className="gomoku-board">
          {room.board.map((v, i) => (
            <div key={i} className={`gomoku-cell${STAR_POINTS.includes(i) ? ' star-point' : ''}`}>
              {v === PLAYER_BLACK && <div className="stone stone-black" />}
              {v === PLAYER_WHITE && <div className="stone stone-white" />}
            </div>
          ))}
        </div>
        <SocialBar room={room} onUpdate={onUpdate} />
      </div>
    );
  }

  return (
    <div className="screen">
      <h1>Gomoku</h1>
      <p className="muted">
        {room.status === 'waiting' ? 'Waiting for opponent…' : myTurn ? 'Your turn' : `${other?.firstName}'s turn`}
      </p>
      <p className="muted">⚫ {blackCount} — ⚪ {whiteCount}</p>

      <SocialBar room={room} onUpdate={onUpdate} />

      <div className="gomoku-board">
        {room.board.map((v, i) => (
            <button
              key={i}
              className={`gomoku-cell${STAR_POINTS.includes(i) ? ' star-point' : ''}`}
              onClick={() => place(i)}
              disabled={v !== 0 || !myTurn || busy}
            >
              {v === PLAYER_BLACK && <div className="stone stone-black" />}
              {v === PLAYER_WHITE && <div className="stone stone-white" />}
            </button>
          ))}
      </div>

      {myTurn ? (
        <p className="muted">Tap an intersection to place your stone</p>
      ) : (
        <p className="muted">Waiting for {other?.firstName ?? 'your partner'}…</p>
      )}
    </div>
  );
}
