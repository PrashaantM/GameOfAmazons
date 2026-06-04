import { getAllMoves, applyMove, countMobility } from './gameLogic';

function evaluate(state, aiColor, oppColor) {
  return countMobility(state, aiColor) - countMobility(state, oppColor);
}

// Sample up to `limit` moves randomly from the full list.
function sample(moves, limit) {
  if (moves.length <= limit) return moves;
  const out = [];
  for (let i = 0; i < limit; i++) {
    out.push(moves[Math.floor(Math.random() * moves.length)]);
  }
  return out;
}

// Minimax with alpha-beta pruning.
// isMaximizing=true → it's the AI's turn (maximize score).
// isMaximizing=false → it's the opponent's turn (minimize score).
function minimax(state, depth, isMaximizing, aiColor, oppColor, alpha, beta) {
  if (depth === 0) return evaluate(state, aiColor, oppColor);

  const color = isMaximizing ? aiColor : oppColor;
  const moves = getAllMoves(state, color);

  if (moves.length === 0) return isMaximizing ? -10000 : 10000;

  const candidates = sample(moves, 15);

  if (isMaximizing) {
    let best = -Infinity;
    for (const m of candidates) {
      const next = applyMove(state, m.startX, m.startY, m.endX, m.endY, m.arrowX, m.arrowY);
      const score = minimax(next, depth - 1, false, aiColor, oppColor, alpha, beta);
      if (score > best) best = score;
      if (score > alpha) alpha = score;
      if (beta <= alpha) break;
    }
    return best;
  } else {
    let best = Infinity;
    for (const m of candidates) {
      const next = applyMove(state, m.startX, m.startY, m.endX, m.endY, m.arrowX, m.arrowY);
      const score = minimax(next, depth - 1, true, aiColor, oppColor, alpha, beta);
      if (score < best) best = score;
      if (score < beta) beta = score;
      if (beta <= alpha) break;
    }
    return best;
  }
}

// Returns the best move for `aiColor` using depth-2 minimax.
export function getAIMove(state, aiColor) {
  const oppColor = aiColor === 1 ? 2 : 1;
  const moves = getAllMoves(state, aiColor);
  if (moves.length === 0) return null;

  const candidates = sample(moves, 30);

  let best = candidates[0];
  let bestScore = -Infinity;
  for (const m of candidates) {
    const next = applyMove(state, m.startX, m.startY, m.endX, m.endY, m.arrowX, m.arrowY);
    // depth=1 → opponent makes one response, then evaluate
    const score = minimax(next, 1, false, aiColor, oppColor, -Infinity, Infinity);
    if (score > bestScore) { bestScore = score; best = m; }
  }
  return best;
}
