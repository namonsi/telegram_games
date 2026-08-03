import assert from 'node:assert';
import { createRoom, guess, isReady, join, rematch, setChat, setReaction, setTarget } from './engine';
import type { Player } from './types';

const alice: Player = { id: 'a', firstName: 'Alice', telegram: { tgId: 111 } };
const bob: Player = { id: 'b', firstName: 'Bob', telegram: { tgId: 222 } };

let room = createRoom('r1', { min: 1, max: 100 }, alice);
assert.equal(room.status, 'waiting', 'room starts waiting');
assert.equal(isReady(room), false, 'not ready before join');
assert.throws(() => guess(room, 'a', 50), /not in progress/, 'cannot guess while waiting');

room = join(room, bob);
assert.equal(room.status, 'setup', 'join moves to setup');

room = setTarget(room, 'a', 42);
assert.equal(isReady(room), false, 'one target set is not ready');
assert.equal(room.status, 'setup', 'still setup with one target');
room = setTarget(room, 'b', 30);
assert.equal(isReady(room), true, 'both targets set is ready');
assert.equal(room.status, 'playing', 'status playing after targets');

assert.throws(() => setTarget(room, 'a', 0), /between/, 'out-of-range target rejected');
assert.throws(() => guess(room, 'b', 50), /Not your turn/, 'b cannot move before a');

let out = guess(room, 'a', 50);
assert.equal(out.hint, 'lower', '50 is lower than 42');
assert.equal(out.room.turn, 'b', 'turn switches after a miss');

out = guess(out.room, 'b', 20);
assert.equal(out.hint, 'higher', '20 is higher than 30');
assert.equal(out.room.turn, 'a', 'turn switches back');

out = guess(out.room, 'a', 30);
assert.equal(out.hint, 'hit', '30 hits bob target');
assert.equal(out.room.winner, 'a', 'alice wins');
assert.equal(out.room.status, 'finished', 'status finished');
assert.equal(out.room.history.length, 3, 'history has three guesses');
assert.equal(out.room.stats.games, 1, 'games counted');
assert.equal(out.room.stats.wins.a, 1, 'alice has one win');
assert.throws(() => guess(out.room, 'b', 10), /not in progress/, 'no moves after win');

room = setReaction(out.room, '😘', 6000, 1000);
assert.equal(room.reaction?.emoji, '😘', 'reaction stored');
assert.equal(room.reaction?.expiresAt, 7000, 'reaction expiry set');

room = setChat(room, 'love you', 'b', 6000, 1000);
assert.equal(room.chat?.text, 'love you', 'chat stored');
assert.equal(room.chat?.sender, 'b', 'chat sender stored');

room = rematch(room);
assert.equal(room.status, 'setup', 'rematch returns to setup');
assert.equal(room.winner, null, 'rematch clears winner');
assert.equal(room.history.length, 0, 'rematch clears history');
assert.equal(room.stats.games, 1, 'rematch keeps stats');

console.log('engine:check OK');
