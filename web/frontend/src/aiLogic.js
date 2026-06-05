import { getAllMoves, applyMove, countMobility } from './gameLogic';

// --- Configuration ---
const BRANCH = 20;   // top moves considered at each ply
const SAMPLE = 80;   // random candidates to score before picking top BRANCH
const DEPTH  = 2;    // minimax depth (2 = look one opponent ply ahead)

// Evaluation: positive = good for `myColor`.
// Terminal wins/losses get extreme scores so minimax propagates them correctly.
function evaluate(state, myColor, oppColor) {
  const myMob  = countMobility(state, myColor);
  const oppMob = countMobility(state, oppColor);
  if (oppMob === 0) return  1e6;
  if (myMob  === 0) return -1e6;
  return myMob - oppMob;
}

// Partial Fisher-Yates: return n random elements from arr (does not mutate original).
function sampleArray(arr, n) {
  if (arr.length <= n) return arr;
  const a = arr.slice();
  for (let i = 0; i < n; i++) {
    const j = i + Math.floor(Math.random() * (a.length - i));
    const tmp = a[i]; a[i] = a[j]; a[j] = tmp;
  }
  return a.slice(0, n);
}

// Generate all legal moves, sample up to SAMPLE of them, score each with a
// greedy evaluation, and return the top BRANCH by score.
// `color` is the side to move; `opp` is the other side.
function selectMoves(state, color, opp) {
  const all  = getAllMoves(state, color);
  if (all.length === 0) return [];
  const pool = sampleArray(all, SAMPLE);
  const scored = pool.map(m => {
    const s = applyMove(state, m.startX, m.startY, m.endX, m.endY, m.arrowX, m.arrowY);
    return { m, score: countMobility(s, color) - countMobility(s, opp) };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, BRANCH).map(x => x.m);
}

// Minimax with alpha-beta pruning.
// `maximizing` = true when it is `myColor`'s turn.
function minimax(state, depth, alpha, beta, maximizing, myColor, oppColor) {
  if (depth === 0) return evaluate(state, myColor, oppColor);

  const color = maximizing ? myColor : oppColor;
  const opp   = maximizing ? oppColor : myColor;
  const moves = selectMoves(state, color, opp);

  if (moves.length === 0) {
    // Current side has no moves — it loses.
    return maximizing ? -1e6 : 1e6;
  }

  if (maximizing) {
    let best = -Infinity;
    for (const m of moves) {
      const next  = applyMove(state, m.startX, m.startY, m.endX, m.endY, m.arrowX, m.arrowY);
      const score = minimax(next, depth - 1, alpha, beta, false, myColor, oppColor);
      if (score > best) best = score;
      if (score > alpha) alpha = score;
      if (beta <= alpha) break; // beta cut-off
    }
    return best;
  } else {
    let best = Infinity;
    for (const m of moves) {
      const next  = applyMove(state, m.startX, m.startY, m.endX, m.endY, m.arrowX, m.arrowY);
      const score = minimax(next, depth - 1, alpha, beta, true, myColor, oppColor);
      if (score < best) best = score;
      if (score < beta) beta = score;
      if (beta <= alpha) break; // alpha cut-off
    }
    return best;
  }
}

// Public API: returns the best Move object for `playerColor`, or null if no moves.
export function getAIMove(state, playerColor) {
  const opp   = playerColor === 1 ? 2 : 1;
  const moves = selectMoves(state, playerColor, opp);
  if (moves.length === 0) return null;

  let bestMove  = moves[0];
  let bestScore = -Infinity;

  for (const m of moves) {
    const next  = applyMove(state, m.startX, m.startY, m.endX, m.endY, m.arrowX, m.arrowY);
    // Search one ply deeper (opponent responds), then maximise.
    const score = minimax(next, DEPTH - 1, -Infinity, Infinity, false, playerColor, opp);
    if (score > bestScore) {
      bestScore = score;
      bestMove  = m;
    }
  }

  return bestMove;
}
