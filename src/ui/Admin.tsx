import { useEffect, useState } from 'react';
import type { GameKind } from '../game/types';

type GameLog = {
  id: string;
  kind: GameKind;
  players: { id: string; tgId: number; firstName: string; username?: string }[];
  winner: string | null;
  endedAt: number;
};

const KIND_LABEL: Record<GameKind, string> = {
  number: '🔢 Guess the Number',
  knowme: '💕 Know Me',
  battleship: '🚢 Battleship',
  twenty: '❓ 20 Questions',
  mystery: '🕵️ Mystery',
  quiz: '🧠 Quiz Duel',
  wordduel: '🔤 Word Duel',
  emoji: '🧩 Emoji Riddles',
};

/** /admin — finished-games log; lives on the website only, never linked in the bot */
export default function Admin() {
  const [key, setKey] = useState(() => localStorage.getItem('admin-key') ?? '');
  const [input, setInput] = useState(key);
  const [records, setRecords] = useState<GameLog[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async (k: string) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/admin', { headers: { 'x-admin-key': k } });
      const data = (await res.json()) as { records?: GameLog[]; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Failed');
      setRecords(data.records ?? []);
      localStorage.setItem('admin-key', k);
      setKey(k);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (key) void load(key);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!records) {
    return (
      <div className="admin-wrap">
        <h1>🔐 Admin</h1>
        <p className="muted">Enter the admin key to see the games log.</p>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Admin key"
          type="password"
        />
        {error && <p className="error">{error}</p>}
        <button onClick={() => load(input)} disabled={busy || !input.trim()}>
          {busy ? 'Checking…' : 'Unlock'}
        </button>
      </div>
    );
  }

  return (
    <div className="admin-wrap">
      <h1>📊 Games log</h1>
      <p className="muted">
        {records.length} finished games (latest first) ·{' '}
        <button className="secondary" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => load(key)} disabled={busy}>
          Refresh
        </button>
      </p>
      {records.length === 0 && <p className="muted">No finished games yet.</p>}
      {records.length > 0 && (
        <table className="admin-table">
          <thead>
            <tr>
              <th>When</th>
              <th>Game</th>
              <th>Players</th>
              <th>Winner</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={r.id + r.endedAt}>
                <td>{new Date(r.endedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</td>
                <td>{KIND_LABEL[r.kind] ?? r.kind}</td>
                <td>
                  {r.players.map((p) => (
                    <div key={p.id}>
                      {p.firstName}{' '}
                      <span className="muted">
                        {p.username ? `@${p.username}` : ''} · id {p.tgId}
                      </span>
                    </div>
                  ))}
                </td>
                <td>
                  {r.winner === 'team'
                    ? '🤝 solved together'
                    : r.winner === null
                      ? '— draw / cold'
                      : (r.players.find((p) => p.id === r.winner)?.firstName ?? r.winner)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
