import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

const COLOR_HEX: Record<Color, { main: string; light: string; dark: string }> = {
  red: { main: '#DC2626', light: '#FCA5A5', dark: '#991B1B' },
  blue: { main: '#2563EB', light: '#93C5FD', dark: '#1E40AF' },
  green: { main: '#16A34A', light: '#86EFAC', dark: '#166534' },
  yellow: { main: '#EAB308', light: '#FDE047', dark: '#A16207' },
};

const FACE_DISPLAY: Record<string, string> = {
  skip: '\u2298',
  draw2: '+2',
  wild: '\u2605',
  wild4: '+4',
};

const SUIT_SYMBOL: Record<Color, string> = {
  red: '\u2665',
  blue: '\u2666',
  green: '\u2663',
  yellow: '\u2660',
};

function UnoSvgCard({
  card,
  width = 72,
  faceDown = false,
  className = '',
  style,
}: {
  card: number;
  width?: number;
  faceDown?: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  const color = getColor(card);
  const face = getFace(card);
  const isWild = color === 'wild';
  const faceStr = typeof face === 'number' ? String(face) : FACE_DISPLAY[face] ?? '?';
  const isSpecial = face === 'skip' || face === 'draw2' || face === 'wild' || face === 'wild4';
  const colors = isWild ? { main: '#555', light: '#999', dark: '#333' } : COLOR_HEX[color];
  const suit = isWild ? '\u2605' : SUIT_SYMBOL[color];
  const height = width * 1.4;
  const id = 'c' + card;

  if (faceDown) {
    return (
      <svg className={className} style={style} width={width} height={height} viewBox="0 0 72 100">
        <defs>
          <pattern id="cb" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="8" height="8" fill="#1E1B4B" />
            <rect width="4" height="8" fill="#312E81" />
          </pattern>
        </defs>
        <rect x="1" y="1" width="70" height="98" rx="8" fill="url(#cb)" stroke="#4338CA" strokeWidth="2" />
        <rect x="6" y="6" width="60" height="88" rx="5" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
        <circle cx="36" cy="50" r="12" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" />
      </svg>
    );
  }

  return (
    <svg className={className} style={style} width={width} height={height} viewBox="0 0 72 100">
      <defs>
        <linearGradient id={'bg-' + id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={colors.light} />
          <stop offset="100%" stopColor={colors.main} />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="70" height="98" rx="8" fill={'url(#bg-' + id + ')'} stroke={colors.dark} strokeWidth="2" />
      <rect x="5" y="5" width="62" height="90" rx="5" fill="none" stroke={colors.dark} strokeWidth="0.5" opacity="0.3" />
      <text x="10" y="18" fontSize="14" fontWeight="800" fill="#FFF" textAnchor="middle">{faceStr}</text>
      <text x="10" y="28" fontSize="10" fill="#FFF" textAnchor="middle" opacity="0.9">{suit}</text>
      {isSpecial ? (
        <text x="36" y="56" fontSize={isWild ? '36' : '32'} fontWeight="900" fill="#FFF" textAnchor="middle">{faceStr}</text>
      ) : (
        <>
          <text x="36" y="52" fontSize="32" fontWeight="900" fill="#FFF" textAnchor="middle">{faceStr}</text>
          <text x="36" y="68" fontSize="16" fill="#FFF" textAnchor="middle" opacity="0.8">{suit}</text>
        </>
      )}
      <g transform="rotate(180, 36, 50)">
        <text x="10" y="18" fontSize="14" fontWeight="800" fill="#FFF" textAnchor="middle">{faceStr}</text>
        <text x="10" y="28" fontSize="10" fill="#FFF" textAnchor="middle" opacity="0.9">{suit}</text>
      </g>
      {isWild && (
        <>
          <rect x="1" y="1" width="70" height="6" rx="8" fill="#DC2626" opacity="0.6" />
          <rect x="1" y="93" width="70" height="6" rx="8" fill="#2563EB" opacity="0.6" />
        </>
      )}
    </svg>
  );
}

function OpponentHand({ count }: { count: number }) {
  return (
    <div className="c8s-opponent-hand">
      {Array.from({ length: Math.min(count, 15) }, (_, i) => (
        <UnoSvgCard key={i} card={0} faceDown width={36} style={{ marginLeft: i === 0 ? 0 : -12 }} />
      ))}
    </div>
  );
}

function RulesPanel({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      className="c8s-rules-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="c8s-rules-panel"
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2>How to Play</h2>
        <div className="c8s-rules-content">
          <div className="c8s-rule-section">
            <h3>Goal</h3>
            <p>Be the first to get rid of all your cards!</p>
          </div>
          <div className="c8s-rule-section">
            <h3>Playing Cards</h3>
            <p>Match the top card by <strong>color</strong> or <strong>number</strong>.</p>
          </div>
          <div className="c8s-rule-section">
            <h3>Special Cards</h3>
            <div className="c8s-rule-cards">
              <div className="c8s-rule-card">
                <span className="c8s-rule-icon" style={{ background: '#DC2626' }}>{'\u2298'}</span>
                <div><strong>Skip</strong><p>Next player loses their turn</p></div>
              </div>
              <div className="c8s-rule-card">
                <span className="c8s-rule-icon" style={{ background: '#2563EB' }}>+2</span>
                <div><strong>Draw Two</strong><p>Next player draws 2 cards</p></div>
              </div>
              <div className="c8s-rule-card">
                <span className="c8s-rule-icon c8s-rule-wild">{'\u2605'}</span>
                <div><strong>Wild</strong><p>Play on anything, pick a color</p></div>
              </div>
              <div className="c8s-rule-card">
                <span className="c8s-rule-icon c8s-rule-wild">+4</span>
                <div><strong>Wild Draw Four</strong><p>Next player draws 4, pick color</p></div>
              </div>
            </div>
          </div>
          <div className="c8s-rule-section">
            <h3>Can't Play?</h3>
            <p>Tap <strong>Draw Card</strong> to pick up from the deck.</p>
          </div>
        </div>
        <button className="c8s-rules-close" onClick={onClose}>Got it!</button>
      </motion.div>
    </motion.div>
  );
}

export default function Crazy8s({ meId, room, onUpdate }: Props) {
  const [selected, setSelected] = useState<number | null>(null);
  const [colorPicker, setColorPicker] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showRules, setShowRules] = useState(false);

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

  const playableCount = myHand.filter((c) => canPlay(c, topDiscard, room.currentColor)).length;

  switch (room.status) {
    case 'waiting':
      return (
        <div className="screen">
          <h1>{'\uD83C\uDCCF'} Crazy Eights</h1>
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
            emoji={'\uD83C\uDCCF'}
            headline={room.winner === meId ? 'You win!' : room.winner ? (opponent?.firstName ?? 'Partner') + ' wins!' : 'Draw!'}
          />
          <SocialBar room={room} onUpdate={onUpdate} />
        </div>
      );
  }

  return (
    <div className="screen c8s-game">
      <div className="c8s-header">
        <h1>{'\uD83C\uDCCF'} Crazy Eights</h1>
        <button className="c8s-help-btn" onClick={() => setShowRules(true)}>?</button>
      </div>

      <div className="c8s-opponent-area">
        <div className="c8s-player-label">
          <span className="c8s-player-name">{opponent?.firstName ?? 'Partner'}</span>
          <span className="c8s-card-count">{opponentHand} cards</span>
        </div>
        <OpponentHand count={opponentHand} />
      </div>

      <div className="c8s-play-area">
        <div className="c8s-deck-slot">
          <div className="c8s-deck-pile">
            {room.deck.length > 0 && <UnoSvgCard card={0} faceDown width={72} />}
            <span className="c8s-deck-count">{room.deck.length}</span>
          </div>
          <span className="c8s-slot-label">Deck</span>
        </div>

        <div className="c8s-discard-slot">
          <AnimatePresence mode="popLayout">
            {topDiscard !== undefined && (
              <motion.div
                key={topDiscard}
                initial={{ scale: 0.8, y: -20, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              >
                <UnoSvgCard card={topDiscard} width={72} />
              </motion.div>
            )}
          </AnimatePresence>
          <span className="c8s-slot-label">Discard</span>
        </div>

        <div className="c8s-color-slot">
          <motion.div
            className="c8s-color-dot"
            style={{ background: COLOR_HEX[room.currentColor].main }}
            key={room.currentColor}
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          />
          <span className="c8s-slot-label">{room.currentColor}</span>
        </div>
      </div>

      <div className="c8s-action-bar">
        {isMyTurn ? (
          <>
            <span className="c8s-turn-badge c8s-turn-mine">Your turn</span>
            <motion.button
              className="c8s-draw-btn"
              onClick={() => void draw()}
              disabled={busy}
              whileTap={{ scale: 0.95 }}
            >
              {playableCount === 0 ? 'Must Draw' : 'Draw Card'}
            </motion.button>
          </>
        ) : (
          <span className="c8s-turn-badge c8s-turn-theirs">
            {opponent?.firstName ?? 'Partner'}'s turn...
          </span>
        )}
      </div>

      {error && <p className="error">{error}</p>}

      <AnimatePresence>
        {colorPicker && selected !== null && (
          <motion.div
            className="c8s-color-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="c8s-color-modal"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 30, opacity: 0 }}
            >
              <p className="c8s-color-title">Pick a color</p>
              <div className="c8s-color-buttons">
                {COLORS.map((c) => (
                  <motion.button
                    key={c}
                    className="c8s-color-btn"
                    style={{ background: COLOR_HEX[c].main }}
                    onClick={() => void play(selected, c)}
                    disabled={busy}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <span>{SUIT_SYMBOL[c]}</span>
                  </motion.button>
                ))}
              </div>
              <button className="c8s-color-cancel" onClick={() => { setColorPicker(false); setSelected(null); }}>Cancel</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="c8s-hand-area">
        <div className="c8s-player-label">
          <span className="c8s-player-name">You</span>
          <span className="c8s-card-count">{myHand.length} cards</span>
        </div>
        <div className="c8s-hand">
          {myHand.map((card, idx) => {
            const isPlayable = canPlay(card, topDiscard, room.currentColor);
            const isSelected = selected === idx;
            const total = myHand.length;
            const angle = (idx - (total - 1) / 2) * 5;
            const yOffset = Math.abs(idx - (total - 1) / 2) * 2;

            return (
              <motion.div
                key={card + '-' + idx}
                className={'c8s-hand-card ' + (isPlayable && isMyTurn ? 'playable' : '') + (isSelected ? ' selected' : '')}
                style={{ zIndex: idx }}
                animate={{
                  rotate: angle,
                  y: isSelected ? -20 : yOffset,
                  scale: isSelected ? 1.08 : 1,
                }}
                whileHover={isPlayable && isMyTurn ? { y: -12, scale: 1.04 } : undefined}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                onClick={() => handleCardClick(idx)}
              >
                <UnoSvgCard card={card} width={72} />
              </motion.div>
            );
          })}
        </div>
      </div>

      <SocialBar room={room} onUpdate={onUpdate} />

      <AnimatePresence>
        {showRules && <RulesPanel onClose={() => setShowRules(false)} />}
      </AnimatePresence>
    </div>
  );
}
