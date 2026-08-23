import { useMemo, useState } from 'react';
import confetti from 'canvas-confetti';
import { GIFT_ART, LOVE_NOTES } from './surprises';
import type { SurpriseKind } from '../api';

type Props = {
  kind: SurpriseKind;
  onDone: () => void;
};

/** full-screen overlay for the namon_si surprise: sealed envelope -> love note -> virtual gift */
export default function SurpriseGate({ onDone }: Props) {
  const [stage, setStage] = useState<'sealed' | 'open'>('sealed');

  const note = useMemo(() => LOVE_NOTES[Math.floor(Math.random() * LOVE_NOTES.length)], []);
  const gift = useMemo(() => GIFT_ART[Math.floor(Math.random() * GIFT_ART.length)], []);
  // ponytail: random pick each open; no persistence — surprises should feel fresh anyway

  const open = () => {
    setStage('open');
    const heart = confetti.shapeFromText({ text: '❤️', scalar: 2 });
    confetti({ shapes: [heart], particleCount: 60, spread: 100, origin: { y: 0.4 }, scalar: 1.6 });
    setTimeout(() => confetti({ shapes: [heart], particleCount: 40, spread: 130, origin: { y: 0.3 }, scalar: 1.4 }), 500);
  };

  return (
    <div className="gate">
      {stage === 'sealed' ? (
        <button className="envelope" onClick={open} aria-label="Open your surprise">
          <div className="envelope-body">
            <div className="flap" />
            <div className="heart-seal">💌</div>
            <p>For you, my love</p>
          </div>
        </button>
      ) : (
        <div className="surprise-open">
          <div className="note-card">
            <div className="note-paper">
              <p>{note}</p>
            </div>
          </div>
          <div className="giftcard">
            <div className="gift-emoji">{gift.emoji}</div>
            <p>{gift.label}</p>
            <span className="muted">from someone who loves you endlessly ✨</span>
          </div>
          <button onClick={onDone}>Accept with a smile 💕</button>
        </div>
      )}
    </div>
  );
}
