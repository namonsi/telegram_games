import assert from 'node:assert';
import { createRoom, guess, isReady, setTarget } from './engine';
import type { Player } from './types';

const alice: Player = { id: 'a', firstName: 'Alice' };
const bob: Player = { id: 'b', firstName: 'Bob' };

let room = createRoom('r1', { min: 1, max: 100 }, [alice, bob]);
assert.equal(isReady(room), false, 'not ready before targets');

room = setTarget(room, 'a', 42);
assert.equal(isReady(room), false, 'one target set is not ready');
room = setTarget(room, 'b', 30);
assert.equal(isReady(room), true, 'both targets set is ready');

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
assert.equal(out.room.history.length, 3, 'history has three guesses');
assert.throws(() => guess(out.room, 'b', 10), /Game is over/, 'no moves after win');

console.log('engine:check OK');
