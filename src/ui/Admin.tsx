import { useEffect, useMemo, useState } from 'react';
import type { GameKind } from '../game/types';

type GameLog = {
  id: string;
  kind: GameKind;
  createdBy: string;
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

/** /admin — games log; lives on the website only, never linked in the bot */
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

  // Deduplicate: each game may have a "created" entry (winner=null) and a "finished" entry (winner set).
  // Keep only the latest entry per game ID so finished games show the result, in-progress games show up too.
  const latest = useMemo(() => {
    if (!records) return [];
    const byId = new Map<string, GameLog>();
    for (const r of records) {
      const existing = byId.get(r.id);
      if (!existing || r.endedAt > existing.endedAt) byId.set(r.id, r);
    }
    return Array.from(byId.values()).sort((a, b) => b.endedAt - a.endedAt);
  }, [records]);

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

  const finished = latest.filter((r) => r.winner !== null).length;
  const inProgress = latest.length - finished;

  return (
    <div className="admin-wrap">
      <h1>📊 Games log</h1>
      <p className="muted">
        {latest.length} games · {finished} finished · {inProgress} in progress ·{' '}
        <button className="secondary" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => load(key)} disabled={busy}>
          Refresh
        </button>
      </p>
      {latest.length === 0 && <p className="muted">No games yet.</p>}
      {latest.length > 0 && (
        <table className="admin-table">
          <thead>
            <tr>
              <th>When</th>
              <th>Game</th>
              <th>Players</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {latest.map((r) => {
              const creator = r.players.find((p) => p.id === r.createdBy);
              const joiner = r.players.find((p) => p.id !== r.createdBy);
              const isFinished = r.winner !== null;
              return (
                <tr key={r.id}>
                  <td>{new Date(r.endedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</td>
                  <td>{KIND_LABEL[r.kind] ?? r.kind}</td>
                  <td>
                    <div>
                      {creator?.firstName ?? 'Unknown'}{' '}
                      <span className="muted">
                        {creator?.username ? `@${creator.username}` : ''} · created
                      </span>
                    </div>
                    {joiner && (
                      <div>
                        {joiner.firstName}{' '}
                        <span className="muted">
                          {joiner.username ? `@${joiner.username}` : ''} · joined
                        </span>
                      </div>
                    )}
                  </td>
                  <td>
                    {!isFinished ? (
                      <span className="muted">⏳ in progress</span>
                    ) : r.winner === 'team' ? (
                      '🤝 solved together'
                    ) : (
                      (r.players.find((p) => p.id === r.winner)?.firstName ?? 'Unknown') + ' ✅'
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
