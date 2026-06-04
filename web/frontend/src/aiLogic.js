import { getAllMoves, applyMove, countMobility } from './gameLogic';

function evaluate(state, color, opp) {
  return countMobility(state, color) - countMobility(state, opp);
}

// Returns a move object or null if no moves available.
// Samples up to SAMPLE_SIZE random moves and picks the highest-scoring one.
export function getAIMove(state, playerColor) {
  const opp = playerColor === 1 ? 2 : 1;
  const moves = getAllMoves(state, playerColor);
  if (moves.length === 0) return null;

  const SAMPLE_SIZE = 50;
  const sampled = moves.length <= SAMPLE_SIZE
    ? moves
    : Array.from({ length: SAMPLE_SIZE }, () => moves[Math.floor(Math.random() * moves.length)]);

  let best = sampled[0];
  let bestScore = -Infinity;
  for (const move of sampled) {
    const next = applyMove(state, move.startX, move.startY, move.endX, move.endY, move.arrowX, move.arrowY);
    const score = evaluate(next, playerColor, opp);
    if (score > bestScore) { bestScore = score; best = move; }
  }
  return best;
}
