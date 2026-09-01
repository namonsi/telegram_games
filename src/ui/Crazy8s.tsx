import { useState } from 'react';
import type { Crazy8sRoom, Color } from '../game/types';
import { api } from '../api';
import { getColor, getFace, canPlay } from '../game/crazy8s';
import { GameOver, PartnerWait } from './shared';
import SocialBar from './SocialBar';

type Props = {
  meId: string;
  room: Crazy8sRoom;
  onUpdate: (room: Crazy8sRoom) => void;
};

const COLORS: Color[] = ['red', 'blue', 'green', 'yellow'];

function cardColorClass(card: number): string {
  const c = getColor(card);
  return c === 'wild' ? 'wild' : c;
}

function cardDisplay(card: number): { label: string; sub: string } {
  const face = getFace(card);
  if (face === 'wild') return { label: 'W', sub: 'Wild' };
  if (face === 'wild4') return { label: 'W+4', sub: 'Wild' };
  if (face === 'skip') return { label: '⊘', sub: 'Skip' };
  if (face === 'draw2') return { label: '+2', sub: 'Draw' };
  return { label: String(face), sub: '' };
}

function Card({ card, onClick, disabled, style }: { card: number; onClick?: () => void; disabled?: boolean; style?: React.CSSProperties }) {
  const { label, sub } = cardDisplay(card);
  const cls = `c8s-card ${cardColorClass(card)}`;
  return (
    <button className={cls} onClick={onClick} disabled={disabled} type="button" style={style}>
      <span className="card-label">{label}</span>
      {sub && <span className="card-sub">{sub}</span>}
    </button>
  );
}

function OpponentHand({ count }: { count: number }) {
  return (
    <div className="c8s-opponent-hand">
      {Array.from({ length: Math.min(count, 15) }, (_, i) => (
        <div key={i} className="c8s-card-back" />
      ))}
    </div>
  );
}

export default function Crazy8s({ meId, room, onUpdate }: Props) {
  const [selected, setSelected] = useState<number | null>(null);
  const [colorPicker, setColorPicker] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const isMyTurn = room.turn === meId && room.status === 'playing';
  const topDiscard = room.discard[room.discard.length - 1];
  const opponent = room.players.find((p) => p.id !== meId);
  const opponentHand = opponent ? (room.handCount?.[opponent.id] ?? 0) : 0;
  const myHand = room.hands[meId] ?? [];

  const play = async (cardIndex: number, chosenColor?: string) => {
    setBusy(true);
    setError(null);
    try {
      const next = await api.playCard(room.id, cardIndex, chosenColor);
      onUpdate(next);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
      setSelected(null);
      setColorPicker(false);
    }
  };

  const draw = async () => {
    setBusy(true);
    setError(null);
    try {
      const next = await api.drawCard(room.id);
      onUpdate(next);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const handleCardClick = (idx: number) => {
    if (!isMyTurn || busy) return;
    const card = myHand[idx];
    if (!canPlay(card, topDiscard, room.currentColor)) return;
    if (getColor(card) === 'wild') {
      setSelected(idx);
      setColorPicker(true);
    } else {
      void play(idx);
    }
  };

  switch (room.status) {
    case 'waiting':
      return (
        <div className="screen">
          <h1>🃏 Crazy Eights</h1>
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
            emoji="🃏"
            headline={room.winner === meId ? 'You win!' : room.winner ? `${opponent?.firstName ?? 'Partner'} wins!` : 'Draw!'}
          />
          <SocialBar room={room} onUpdate={onUpdate} />
        </div>
      );
  }

  return (
    <div className="screen">
      <h1>🃏 Crazy Eights</h1>

      {/* Opponent */}
      <div style={{ textAlign: 'center' }}>
        <p className="muted" style={{ margin: 0 }}>
          {opponent?.firstName ?? 'Partner'} — {opponentHand} cards
        </p>
        <OpponentHand count={opponentHand} />
      </div>

      {/* Play area */}
      <div className="c8s-play-area">
        <div
          className="c8s-discard"
          style={{
            background: topDiscard !== undefined ? undefined : 'var(--card)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {topDiscard !== undefined && <Card card={topDiscard} disabled />}
        </div>
        <div className={`c8s-color-dot ${room.currentColor}`} />
        <div className="c8s-deck" title={`${room.deck.length} cards left`} />
      </div>

      <p className="muted" style={{ textAlign: 'center', margin: 0, fontSize: 12 }}>
        Deck: {room.deck.length} · Color: {room.currentColor}
      </p>

      {/* Draw / turn indicator */}
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        {isMyTurn ? (
          <button className="c8s-draw-btn" onClick={() => void draw()} disabled={busy}>
            Draw card
          </button>
        ) : (
          <p className="muted" style={{ margin: 0 }}>
            {opponent?.firstName ?? 'Partner'}'s turn…
          </p>
        )}
      </div>

      {error && <p className="error">{error}</p>}

      {/* Color picker */}
      {colorPicker && selected !== null && (
        <div className="c8s-color-picker">
          {COLORS.map((c) => (
            <button
              key={c}
              className={`c8s-color-dot ${c}`}
              onClick={() => void play(selected, c)}
              disabled={busy}
              style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid transparent', cursor: 'pointer' }}
              title={c}
            />
          ))}
        </div>
      )}

      {/* My hand */}
      <div className="c8s-hand">
        {myHand.map((card, idx) => {
          const angle = (idx - myHand.length / 2) * 5;
          return (
            <Card
              key={`${card}-${idx}`}
              card={card}
              onClick={() => handleCardClick(idx)}
              disabled={!isMyTurn || busy}
              style={{ transform: `rotate(${angle}deg)` }}
            />
          );
        })}
      </div>

      {myHand.length === 0 && <p className="muted" style={{ textAlign: 'center' }}>Waiting for result…</p>}

      <SocialBar room={room} onUpdate={onUpdate} />
    </div>
  );
}
