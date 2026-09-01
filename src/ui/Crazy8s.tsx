import { useState, useEffect, useRef } from 'react';
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

const COLOR_MAP: Record<Color, { bg: string; text: string; border: string }> = {
  red: { bg: '#dc2626', text: '#fff', border: '#991b1b' },
  blue: { bg: '#2563eb', text: '#fff', border: '#1e40af' },
  green: { bg: '#16a34a', text: '#fff', border: '#166534' },
  yellow: { bg: '#eab308', text: '#1a1a1a', border: '#a16207' },
};

const FACE_SYMBOLS: Record<string, string> = {
  skip: '⊘',
  draw2: '+2',
  wild: '★',
  wild4: '+4',
};

function getCardVisual(card: number) {
  const color = getColor(card);
  const face = getFace(card);
  const isWild = color === 'wild';
  const faceStr = typeof face === 'number' ? String(face) : FACE_SYMBOLS[face] ?? face;
  const colorName = isWild ? 'wild' : color;
  const colors = isWild ? { bg: 'linear-gradient(135deg, #dc2626 0%, #2563eb 33%, #16a34a 66%, #eab308 100%)', text: '#fff', border: '#333' } : COLOR_MAP[color];
  return { faceStr, colorName, colors, isWild, isSpecial: face === 'skip' || face === 'draw2' || face === 'wild' || face === 'wild4' };
}

function Card({ card, onClick, disabled, style, className = '', faceDown = false }: {
  card: number;
  onClick?: () => void;
  disabled?: boolean;
  style?: React.CSSProperties;
  className?: string;
  faceDown?: boolean;
}) {
  const { faceStr, colorName, colors, isWild, isSpecial } = getCardVisual(card);

  if (faceDown) {
    return (
      <div className={`c8s-card c8s-card-face-down ${className}`} style={style}>
        <div className="c8s-card-back-pattern">
          <div className="c8s-card-back-inner" />
        </div>
      </div>
    );
  }

  return (
    <button
      className={`c8s-card c8s-card-face-up c8s-card-${colorName} ${isSpecial ? 'c8s-card-special' : ''} ${className}`}
      onClick={onClick}
      disabled={disabled}
      type="button"
      style={{ ...style, '--card-bg': colors.bg, '--card-text': colors.text, '--card-border': colors.border } as React.CSSProperties}
    >
      <div className="c8s-card-tl">
        <span className="c8s-card-corner-value">{faceStr}</span>
        <span className="c8s-card-corner-suit">{isWild ? '★' : colorName === 'red' ? '♥' : colorName === 'blue' ? '♦' : colorName === 'green' ? '♣' : '♠'}</span>
      </div>
      <div className="c8s-card-center">
        <span className="c8s-card-center-value">{faceStr}</span>
        {!isWild && <span className="c8s-card-center-suit">{colorName === 'red' ? '♥' : colorName === 'blue' ? '♦' : colorName === 'green' ? '♣' : '♠'}</span>}
      </div>
      <div className="c8s-card-br">
        <span className="c8s-card-corner-value">{faceStr}</span>
        <span className="c8s-card-corner-suit">{isWild ? '★' : colorName === 'red' ? '♥' : colorName === 'blue' ? '♦' : colorName === 'green' ? '♣' : '♠'}</span>
      </div>
    </button>
  );
}

function OpponentHand({ count }: { count: number }) {
  return (
    <div className="c8s-opponent-hand">
      {Array.from({ length: Math.min(count, 15) }, (_, i) => (
        <div key={i} className="c8s-card-back-small" />
      ))}
    </div>
  );
}

function RulesPanel({ onClose }: { onClose: () => void }) {
  return (
    <div className="c8s-rules-overlay" onClick={onClose}>
      <div className="c8s-rules-panel" onClick={(e) => e.stopPropagation()}>
        <h2>🃏 How to Play Crazy Eights</h2>
        <div className="c8s-rules-content">
          <div className="c8s-rule-section">
            <h3>Goal</h3>
            <p>Be the first to get rid of all your cards!</p>
          </div>
          <div className="c8s-rule-section">
            <h3>Playing Cards</h3>
            <p>Match the top card by <strong>color</strong> or <strong>number/symbol</strong>.</p>
            <p>Example: Play a red 7 on any red card, or any 7 on a red 7.</p>
          </div>
          <div className="c8s-rule-section">
            <h3>Special Cards</h3>
            <div className="c8s-rule-cards">
              <div className="c8s-rule-card">
                <span className="c8s-rule-card-icon c8s-card-red">⊘</span>
                <div>
                  <strong>Skip</strong>
                  <p>Next player loses their turn</p>
                </div>
              </div>
              <div className="c8s-rule-card">
                <span className="c8s-rule-card-icon c8s-card-red">+2</span>
                <div>
                  <strong>Draw Two</strong>
                  <p>Next player draws 2 cards and loses turn</p>
                </div>
              </div>
              <div className="c8s-rule-card">
                <span className="c8s-rule-card-icon c8s-wild">★</span>
                <div>
                  <strong>Wild</strong>
                  <p>Play on anything, choose any color</p>
                </div>
              </div>
              <div className="c8s-rule-card">
                <span className="c8s-rule-card-icon c8s-wild">+4</span>
                <div>
                  <strong>Wild Draw Four</strong>
                  <p>Next player draws 4, you choose color</p>
                </div>
              </div>
            </div>
          </div>
          <div className="c8s-rule-section">
            <h3>Can't Play?</h3>
            <p>Tap <strong>Draw Card</strong> to pick up from the deck. If the drawn card can be played, you can play it immediately!</p>
          </div>
          <div className="c8s-rule-section">
            <h3>Winning</h3>
            <p>First to empty their hand wins. The current color indicator shows which color is active.</p>
          </div>
        </div>
        <button className="c8s-rules-close" onClick={onClose}>Got it!</button>
      </div>
    </div>
  );
}

export default function Crazy8s({ meId, room, onUpdate }: Props) {
  const [selected, setSelected] = useState<number | null>(null);
  const [colorPicker, setColorPicker] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [lastAction, setLastAction] = useState<'play' | 'draw' | null>(null);
  const [animatedCard, setAnimatedCard] = useState<number | null>(null);
  const discardRef = useRef<HTMLDivElement>(null);

  const isMyTurn = room.turn === meId && room.status === 'playing';
  const topDiscard = room.discard[room.discard.length - 1];
  const opponent = room.players.find((p) => p.id !== meId);
  const opponentHand = opponent ? (room.handCount?.[opponent.id] ?? 0) : 0;
  const myHand = room.hands[meId] ?? [];

  useEffect(() => {
    if (lastAction) {
      const t = setTimeout(() => setLastAction(null), 600);
      return () => clearTimeout(t);
    }
  }, [lastAction]);

  const play = async (cardIndex: number, chosenColor?: string) => {
    setBusy(true);
    setError(null);
    setAnimatedCard(myHand[cardIndex] ?? null);
    setLastAction('play');
    try {
      const next = await api.playCard(room.id, cardIndex, chosenColor);
      onUpdate(next);
    } catch (e) {
      setError((e as Error).message);
      setAnimatedCard(null);
    } finally {
      setBusy(false);
      setSelected(null);
      setColorPicker(false);
      setTimeout(() => setAnimatedCard(null), 300);
    }
  };

  const draw = async () => {
    setBusy(true);
    setError(null);
    setLastAction('draw');
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

  const playableCards = myHand.filter((c) => canPlay(c, topDiscard, room.currentColor));

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
    <div className="screen c8s-game">
      <div className="c8s-header">
        <h1>🃏 Crazy Eights</h1>
        <button className="c8s-help-btn" onClick={() => setShowRules(true)} title="How to play">?</button>
      </div>

      {/* Opponent */}
      <div className="c8s-opponent-area">
        <div className="c8s-player-label">
          <span className="c8s-player-name">{opponent?.firstName ?? 'Partner'}</span>
          <span className="c8s-card-count">{opponentHand} cards</span>
        </div>
        <OpponentHand count={opponentHand} />
      </div>

      {/* Play area */}
      <div className="c8s-play-area">
        <div className="c8s-deck-area">
          <div className="c8s-deck" title={`${room.deck.length} cards left`}>
            <div className="c8s-deck-count">{room.deck.length}</div>
          </div>
          <span className="c8s-area-label">Deck</span>
        </div>

        <div className="c8s-discard-area" ref={discardRef}>
          <div className={`c8s-discard ${lastAction === 'play' ? 'c8s-discard-animate' : ''}`}>
            {topDiscard !== undefined && (
              <Card card={topDiscard} disabled className="c8s-discard-card" />
            )}
          </div>
          <span className="c8s-area-label">Discard</span>
        </div>

        <div className="c8s-color-area">
          <div className={`c8s-color-indicator c8s-color-${room.currentColor}`}>
            <span>{room.currentColor}</span>
          </div>
          <span className="c8s-area-label">Active Color</span>
        </div>
      </div>

      {/* Turn indicator + draw */}
      <div className="c8s-action-area">
        {isMyTurn ? (
          <>
            <div className="c8s-turn-indicator c8s-turn-mine">Your turn</div>
            <button
              className={`c8s-draw-btn ${playableCards.length === 0 ? 'c8s-draw-btn-must' : ''}`}
              onClick={() => void draw()}
              disabled={busy}
            >
              {playableCards.length === 0 ? 'Must Draw' : 'Draw Card'}
            </button>
          </>
        ) : (
          <div className="c8s-turn-indicator c8s-turn-theirs">
            {opponent?.firstName ?? 'Partner'}'s turn…
          </div>
        )}
      </div>

      {error && <p className="error">{error}</p>}

      {/* Color picker */}
      {colorPicker && selected !== null && (
        <div className="c8s-color-picker-overlay">
          <div className="c8s-color-picker">
            <p className="c8s-color-picker-title">Choose a color:</p>
            <div className="c8s-color-picker-buttons">
              {COLORS.map((c) => (
                <button
                  key={c}
                  className={`c8s-color-btn c8s-color-${c}`}
                  onClick={() => void play(selected, c)}
                  disabled={busy}
                  title={c}
                >
                  <span className="c8s-color-btn-suit">
                    {c === 'red' ? '♥' : c === 'blue' ? '♦' : c === 'green' ? '♣' : '♠'}
                  </span>
                </button>
              ))}
            </div>
            <button className="c8s-color-picker-cancel" onClick={() => { setColorPicker(false); setSelected(null); }}>Cancel</button>
          </div>
        </div>
      )}

      {/* My hand */}
      <div className="c8s-my-area">
        <div className="c8s-player-label">
          <span className="c8s-player-name">You</span>
          <span className="c8s-card-count">{myHand.length} cards</span>
        </div>
        <div className="c8s-hand">
          {myHand.map((card, idx) => {
            const angle = (idx - myHand.length / 2) * 6;
            const isPlayable = canPlay(card, topDiscard, room.currentColor);
            const isSelected = selected === idx;
            return (
              <Card
                key={`${card}-${idx}`}
                card={card}
                onClick={() => handleCardClick(idx)}
                disabled={!isMyTurn || busy || !isPlayable}
                className={`${isPlayable && isMyTurn ? 'c8s-card-playable' : ''} ${isSelected ? 'c8s-card-selected' : ''} ${animatedCard === card ? 'c8s-card-playing' : ''}`}
                style={{
                  transform: `rotate(${angle}deg) ${isSelected ? 'translateY(-16px)' : ''}`,
                  zIndex: idx,
                }}
              />
            );
          })}
        </div>
      </div>

      <SocialBar room={room} onUpdate={onUpdate} />

      {showRules && <RulesPanel onClose={() => setShowRules(false)} />}
    </div>
  );
}
