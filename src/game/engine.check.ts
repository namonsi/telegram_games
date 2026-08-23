import assert from 'node:assert';
import { createRoom, guess, isReady, join, rematch, setChat, setReaction, setTarget } from './engine';
import * as knowme from './knowme';
import * as battleship from './battleship';
import * as twenty from './twenty';
import * as mystery from './mystery';
import * as quiz from './quiz';
import { MYSTERY_CASES } from '../../api/mysteryCases';
import { QUIZ_BANK } from '../../api/quizBank';
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

// ---------- know me ----------
let km = knowme.createKnowMe('km1', alice);
km = join(km, bob);
const picksA = Array.from({ length: knowme.KNOW_ME_ROUNDS }, (_, i) => ({ q: `Q${i}?`, a: `answer-${i}` }));
const picksB = Array.from({ length: knowme.KNOW_ME_ROUNDS }, (_, i) => ({ q: `B${i}?`, a: `b-answer-${i}` }));
km = knowme.submitPicks(km, 'a', picksA);
assert.equal(km.status, 'setup', 'one side picking is not ready');
km = knowme.submitPicks(km, 'b', picksB);
assert.equal(km.status, 'playing', 'both picked -> playing');
assert.throws(() => knowme.submitPicks(km, 'a', picksA), /Not in setup/, 'no re-pick during play');
assert.equal(knowme.currentQuestion(km)?.q, 'Q0?', 'round 0 asks alice question 0');

// round r: asker players[r%2], guesser the other
for (let r = 0; r < knowme.KNOW_ME_ROUNDS * 2; r++) {
  const guesser = km.turn;
  const secret = r % 2 === 0 ? picksA[Math.floor(r / 2)].a : picksB[Math.floor(r / 2)].a;
  km = knowme.answerKnowMe(km, guesser, secret);
}
assert.equal(km.status, 'finished', 'all rounds done');
assert.equal(km.log.length, knowme.KNOW_ME_ROUNDS * 2, 'ten entries logged');
assert.equal(km.winner, null, 'perfect mirror play is a draw');
km = knowme.rematchKnowMe(km);
assert.equal(km.status, 'setup', 'knowme rematch to setup');

// ---------- battleship ----------
let bs = battleship.createBattleship('bs1', alice);
bs = join(bs, bob);
const shipsA = [[0, 1, 2, 3], [5, 6, 7], [10, 11]]; // straight lines
const shipsB = [[24, 23, 22, 21], [19, 18, 17], [14, 13]];
assert.throws(() => battleship.placeShips(bs, 'a', [[0, 5], [1, 6], [2]]), /sizes/, 'wrong sizes rejected');
assert.throws(() => battleship.placeShips(bs, 'a', [[0, 4, 8, 12], [1, 2, 3], [5, 6]]), /straight/, 'diagonal junk rejected');
bs = battleship.placeShips(bs, 'a', shipsA);
bs = battleship.placeShips(bs, 'b', shipsB);
assert.equal(bs.status, 'playing', 'both fleets placed');

// solo staging before the partner joins must not lock the room
let pre = battleship.placeShips(battleship.createBattleship('bs2', alice), 'a', shipsA);
assert.equal(pre.status, 'waiting', 'creator can stage fleet while waiting');
pre = join(pre, bob);
assert.equal(pre.status, 'setup', 'partner can still join after staging');
assert.throws(() => battleship.fire(bs, 'b', 0), /Not your turn/, 'creator fires first');
bs = battleship.fire(bs, 'a', 0).room;
assert.equal(bs.turn, 'b', 'turn alternates');
// even duel: symmetric target lists -> whoever fires first sinks all nine cells one ply earlier
const targetsA = shipsB.flat();
const targetsB = shipsA.flat();
let ai = 0;
let bi = 0;
const firstShooter = bs.turn;
while (bs.status === 'playing') {
  if (bs.turn === 'a') bs = battleship.fire(bs, 'a', targetsA[ai++]).room;
  else bs = battleship.fire(bs, 'b', targetsB[bi++]).room;
}
assert.equal(bs.winner, firstShooter, 'first shooter wins the symmetric duel');
assert.equal(bs.status, 'finished', 'sunk fleet ends game');

// ---------- twenty ----------
let tw = twenty.createTwenty('tw1', alice); // alice answers first
tw = join(tw, bob);
assert.equal(tw.status, 'setup', 'waiting for secret');
assert.throws(() => twenty.setSecret(tw, 'b', 'x'), /Only the answerer/, 'asker cannot set secret');
tw = twenty.setSecret(tw, 'a', 'Our First Trip!');
assert.equal(tw.status, 'playing', 'secret set -> playing (partner joined)');
tw = twenty.askTwenty(tw, 'b', 'Is it a place?');
assert.equal(tw.used, 1, 'asking burns budget');
tw = twenty.answerTwenty(tw, 'a', 'yes');
assert.equal(tw.question, null, 'answered questions clear');
while (tw.status === 'playing') {
  tw = twenty.askTwenty(tw, 'b', `filler ${tw.used}`);
  tw = twenty.answerTwenty(tw, 'a', tw.used % 3 === 0 ? 'maybe' : tw.used % 3 === 1 ? 'yes' : 'no');
}
assert.equal(tw.status, 'finished', 'budget exhausted -> answerer survives');
assert.equal(tw.winner, 'a', 'answerer wins by survival');
tw = twenty.rematchTwenty(tw);
assert.equal(tw.answererId, 'b', 'roles swap on rematch');

// ---------- mystery co-op ----------
const meta0 = MYSTERY_CASES[0];
let my = mystery.createMystery('my1', alice, 0, meta0);
my = join(my, bob);
my = mystery.startCase(my, 0, meta0);
assert.equal(my.status, 'playing', 'case starts immediately');
assert.throws(() => mystery.investigate(my, 'b'), /Not your turn/, 'creator investigates first');
my = mystery.investigate(my, 'a');
assert.equal(my.revealed, 1, 'one clue revealed');
assert.throws(() => mystery.accuse(my, 'b', 'nope-id', meta0.culpritId), /Unknown suspect/);
const wrongAccuse = mystery.accuse(my, 'b', 'marco', meta0.culpritId);
my = wrongAccuse.room;
assert.equal(wrongAccuse.correct, false, 'wrong accusation flagged');
assert.equal(my.strikes, 1, 'strike recorded');
while (my.status !== 'finished') {
  const culpritId = MYSTERY_CASES[my.caseIndex].culpritId;
  if (my.revealed < my.clueCount) my = mystery.investigate(my, my.turn);
  else my = mystery.accuse(my, my.turn, culpritId, culpritId).room;
}
assert.equal(my.winner, 'team', 'case solved together');
assert.equal(my.stats.solved, 1, 'solved stat counted');
assert.equal(my.stats.games, 1, 'games counted for co-op');

// cold case: three wrong accusations end it without a winner
let cold = mystery.createMystery('my2', alice, 1, MYSTERY_CASES[1]);
cold = join(cold, bob);
cold = mystery.startCase(cold, 1, MYSTERY_CASES[1]);
for (let s = 0; s < mystery.MAX_STRIKES && cold.status !== 'finished'; s++) {
  const wrongSuspect = MYSTERY_CASES[1].suspects.find((x) => x.id !== MYSTERY_CASES[1].culpritId)!.id;
  cold = mystery.accuse(cold, cold.turn, wrongSuspect, MYSTERY_CASES[1].culpritId).room;
}
assert.equal(cold.status, 'finished', 'three strikes end the case');
assert.equal(cold.winner, null, 'cold case has no winner');

// ---------- quiz duel ----------
const bankSize = QUIZ_BANK.length;
let qz = quiz.createQuiz('qz1', alice, bankSize);
qz = join(qz, bob);
qz = { ...qz, status: 'playing' };
const meta = QUIZ_BANK[qz.current];
qz = quiz.answerQuiz(qz, 'a', meta.correct, meta, bankSize);
assert.equal(Object.keys(qz.picks).length, 1, 'waiting for second pick');
assert.equal(qz.results.length, 0, 'no reveal until both answer');
qz = quiz.answerQuiz(qz, 'b', meta.correct, meta, bankSize);
assert.equal(qz.results.length, 1, 'round resolved');
assert.equal(qz.scores.a, 1, 'alice scored');
assert.equal(qz.scores.b, 1, 'bob scored');
assert.notEqual(qz.current, undefined, 'next question ready');
assert.throws(() => quiz.answerQuiz(qz, 'a', 99, meta, bankSize), /Invalid option/, 'out-of-range choice rejected');

// drive to victory
while (qz.status !== 'finished') {
  const m = QUIZ_BANK[qz.current];
  const leader = qz.scores.a >= (qz.scores.b ?? 0) ? 'a' : 'b';
  qz = quiz.answerQuiz(qz, 'a', m.correct, m, bankSize);
  qz = quiz.answerQuiz(qz, 'b', leader === 'a' ? (m.correct + 1) % 4 : m.correct, m, bankSize);
}
assert.equal(Math.max(...Object.values(qz.scores)), quiz.QUIZ_TARGET, 'winner hit the target');

console.log('engine:check OK');
