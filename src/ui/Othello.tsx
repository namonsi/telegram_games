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

  if (room.status === 'finished') {
    const isWinner = room.winner === meId;
    return (
      <div className="screen">
        <h1>Othello</h1>
        <p className="muted">
          {room.winner ? (isWinner ? '🎉 You win!' : `${other?.firstName} wins!`) : '🤝 Draw'}
        </p>
        <p className="muted">
          ⚫ {room.players[0].firstName} {black} — {white} {room.players[1]?.firstName ?? 'Partner'} ⚪
        </p>
        <div className="othello-board">
          {room.board.map((v, i) => (
            <div key={i} className="othello-cell">
              {v === PLAYER_BLACK && <div className="disc disc-black" />}
              {v === PLAYER_WHITE && <div className="disc disc-white" />}
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
        {Array.from({ length: GRID_SIZE }).map((_, r) =>
          Array.from({ length: GRID_SIZE }).map((_, c) => {
            const cell = r * GRID_SIZE + c;
            const v = room.board[cell];
            const isValid = room.validMoves.includes(cell) && myTurn;
            return (
              <button
                key={cell}
                className={`othello-cell${isValid ? ' valid' : ''}`}
                onClick={() => place(cell)}
                disabled={!myTurn || busy || !isValid}
              >
                {v === PLAYER_BLACK && <div className="disc disc-black" />}
                {v === PLAYER_WHITE && <div className="disc disc-white" />}
              </button>
            );
          }),
        )}
      </div>

      {myTurn ? (
        <p className="muted">Your turn — tap a highlighted cell</p>
      ) : (
        <p className="muted">Waiting for {other?.firstName ?? 'your partner'}…</p>
      )}
    </div>
  );
}
