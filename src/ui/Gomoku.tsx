import { useState } from 'react';
import type { GomokuRoom } from '../game/types';
import { api } from '../api';
import { PLAYER_BLACK, PLAYER_WHITE } from '../game/gomoku';
import SocialBar from './SocialBar';

type Props = {
  meId: string;
  room: GomokuRoom;
  onUpdate: (room: GomokuRoom) => void;
};

export default function Gomoku({ meId, room, onUpdate }: Props) {
  const [busy, setBusy] = useState(false);

  const other = room.players.find((p) => p.id !== meId);
  const myTurn = room.turn === meId;
  const myIdx = room.players.findIndex((p) => p.id === meId);
  const myStone = myIdx === 0 ? PLAYER_BLACK : PLAYER_WHITE;

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
          {room.winner ? (isWinner ? '🎉 You win!' : `${other?.firstName} wins!`) : '🤝 Draw — board full'}
        </p>
        <div className="board-meta">⚫ {blackCount} &nbsp; ⚪ {whiteCount}</div>
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
      <h1>Gomoku</h1>
      <p className="muted">
        {room.status === 'waiting' ? 'Waiting for opponent…' : myTurn ? 'Your turn' : `${other?.firstName}'s turn`}
      </p>
      <div className="board-meta">⚫ {blackCount} &nbsp; ⚪ {whiteCount}</div>
      <div className="othello-board">
        {room.board.map((v, i) => {
          const isMyStone = v === myStone;
          return (
            <button
              key={i}
              className={`othello-cell${v !== 0 ? (isMyStone ? ' mine' : ' other') : ''}`}
              onClick={() => place(i)}
              disabled={v !== 0 || !myTurn || busy}
            >
              {v === PLAYER_BLACK ? '⚫' : v === PLAYER_WHITE ? '⚪' : ''}
            </button>
          );
        })}
      </div>
      <SocialBar room={room} onUpdate={onUpdate} />
    </div>
  );
}
