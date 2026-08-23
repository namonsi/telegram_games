import { useEffect, useState } from 'react';
import type { Room } from '../game/types';
import { api } from '../api';

const EMOJIS = ['❤️', '😂', '😘', '😤', '🔥', '🙈'];

type Props<T extends Room> = {
  room: T;
  onUpdate: (room: T) => void;
};

/** shared bubbles + reaction bar + chat row used by every game board */
export default function SocialBar<T extends Room>({ room, onUpdate }: Props<T>) {
  const [text, setText] = useState('');

  const reaction = room.reaction && room.reaction.expiresAt > Date.now() ? room.reaction : null;
  const chat = room.chat && room.chat.expiresAt > Date.now() ? room.chat : null;

  // ponytail: local TTL so the bubble can fade before the next 2s poll clears it
  const [bubbleKey, setBubbleKey] = useState(0);
  useEffect(() => {
    if (room.reaction || room.chat) setBubbleKey((k) => k + 1);
  }, [room.reaction?.emoji, room.chat?.text]);

  const sendReaction = async (emoji: string) => onUpdate((await api.react(room.id, emoji)) as T);

  const sendChat = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onUpdate((await api.chat(room.id, trimmed)) as T);
    setText('');
  };

  return (
    <>
      {reaction && (
        <div className="bubble bubble-react" key={`r${bubbleKey}`}>
          <span className="emoji">{reaction.emoji}</span>
        </div>
      )}
      {chat && (
        <div className="bubble" key={`c${bubbleKey}`}>
          <b>{chat.sender}</b> {chat.text}
        </div>
      )}

      <div className="react-row">
        {EMOJIS.map((e) => (
          <button key={e} className="emoji-btn" onClick={() => sendReaction(e)} aria-label={`React ${e}`}>
            {e}
          </button>
        ))}
      </div>

      <div className="row">
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Say something…" maxLength={160} />
        <button className="secondary" onClick={sendChat} disabled={!text.trim()}>
          Send
        </button>
      </div>
    </>
  );
}
