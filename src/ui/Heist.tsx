import { useState } from 'react';
import type { HeistRoom } from '../game/types';
import { api } from '../api';
import { PRESET_MESSAGES } from '../game/heist';
import { GameOver, PartnerWait } from './shared';
import SocialBar from './SocialBar';

type Props = {
  meId: string;
  room: HeistRoom;
  onUpdate: (room: HeistRoom) => void;
};

const DIRS = [
  { dir: 'up' as const, label: '\u2191' },
  { dir: 'down' as const, label: '\u2193' },
  { dir: 'left' as const, label: '\u2190' },
  { dir: 'right' as const, label: '\u2192' },
];

export default function Heist({ meId, room, onUpdate }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const role = meId === room.vaultRunnerId ? 'vaultRunner' : 'security';
  const isMyTurn = room.turn === meId && room.status === 'playing';
  const opponent = room.players.find((p) => p.id !== meId);

  const move = async (dir: 'up' | 'down' | 'left' | 'right') => {
    setBusy(true);
    setError(null);
    try {
      const next = await api.moveThief(room.id, dir);
      onUpdate(next);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const moveGuard = async (idx: number) => {
    setBusy(true);
    setError(null);
    try {
      const next = await api.moveGuard(room.id, idx);
      onUpdate(next);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const sendMessage = async (text: string) => {
    setBusy(true);
    setError(null);
    try {
      const next = await api.sendHeistMessage(room.id, text);
      onUpdate(next);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  switch (room.status) {
    case 'waiting':
      return (
        <div className="screen">
          <h1>🏦 Heist</h1>
          <PartnerWait room={room} />
          <SocialBar room={room} onUpdate={onUpdate} />
        </div>
      );
    case 'finished':
      return (
        <div className="screen">
          <GameOver
            room={room}
            meId={meId}
            onUpdate={onUpdate}
            emoji="🏦"
            headline={
              room.winner === meId
                ? 'You win!'
                : room.winner
                  ? `${opponent?.firstName ?? 'Partner'} wins!`
                  : 'Draw!'
            }
          />
          <SocialBar room={room} onUpdate={onUpdate} />
        </div>
      );
  }

  const flat = room.grid.flat();

  const renderCell = (cellIdx: number) => {
    const cellVal = flat[cellIdx];
    const classes = ['heist-cell'];
    if (cellVal === 1) classes.push('wall');
    else classes.push('floor');

    const isPatrol = role === 'security' && room.guardPatrols.some((p) => p.includes(cellIdx));
    if (isPatrol) classes.push('patrol');

    let content: React.ReactNode = null;

    if (role === 'vaultRunner') {
      if (cellVal === 2) content = <div className="heist-loot" />;
      else if (cellVal === 3) content = <div className="heist-exit" />;
      if (cellIdx === room.thiefPosition) content = <div className="heist-token thief" />;
    } else {
      const gIdx = room.guardPositions.indexOf(cellIdx);
      if (gIdx !== -1) content = <div className="heist-token guard" />;
    }

    return (
      <div key={cellIdx} className={classes.join(' ')}>
        {content}
      </div>
    );
  };

  return (
    <div className="screen">
      <h1>🏦 Heist</h1>

      <div className="heist-role">
        {role === 'vaultRunner' ? '🔴 Vault Runner' : '🔵 Security'}
        {room.turn === meId ? ' — Your turn' : ` — ${opponent?.firstName ?? 'Partner'}'s turn`}
      </div>

      {role === 'vaultRunner' && (
        <p className="muted" style={{ textAlign: 'center', margin: 0, fontSize: 12 }}>
          Loot: {room.lootCollected}/{room.totalLoot}
        </p>
      )}

      <div className="heist-grid">
        {flat.map((_, i) => renderCell(i))}
      </div>

      {error && <p className="error">{error}</p>}

      {role === 'vaultRunner' && isMyTurn && (
        <div className="heist-controls">
          {DIRS.map(({ dir, label }) => (
            <button
              key={dir}
              className="heist-dir-btn"
              onClick={() => void move(dir)}
              disabled={busy}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {role === 'security' && isMyTurn && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
          {room.guardPatrols.map((_p, idx) => (
            <button
              key={idx}
              className="heist-dir-btn"
              onClick={() => void moveGuard(idx)}
              disabled={busy}
              style={{ width: 'auto', padding: '0 16px', fontSize: 13 }}
            >
              Guard {idx + 1}
            </button>
          ))}
        </div>
      )}

      {!isMyTurn && room.status === 'playing' && (
        <p className="muted" style={{ textAlign: 'center', margin: 0 }}>
          Waiting for {opponent?.firstName ?? 'partner'}…
        </p>
      )}

      <div className="heist-messages">
        {PRESET_MESSAGES.map((msg) => (
          <button
            key={msg}
            className="heist-msg-btn"
            onClick={() => void sendMessage(msg)}
            disabled={busy || room.status !== 'playing'}
          >
            {msg}
          </button>
        ))}
      </div>

      {room.messages.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {room.messages.slice(-5).map((m, i) => {
            const sender = room.players.find((p) => p.id === m.from);
            return (
              <div key={i} className="bubble" style={{ fontSize: 13, padding: '8px 12px' }}>
                <b>{sender?.firstName ?? 'Partner'}</b> {m.text}
              </div>
            );
          })}
        </div>
      )}

      <SocialBar room={room} onUpdate={onUpdate} />
    </div>
  );
}
