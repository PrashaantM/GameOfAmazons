const DIRS = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];

export function initializeGameState() {
  const state = new Array(121).fill(0);
  // Black queens (move first — standard starting positions, top portion)
  state[1  * 11 + 4]  = 1;  // row 1,  col 4
  state[1  * 11 + 7]  = 1;  // row 1,  col 7
  state[4  * 11 + 1]  = 1;  // row 4,  col 1
  state[4  * 11 + 10] = 1;  // row 4,  col 10
  // White queens (bottom portion)
  state[7  * 11 + 1]  = 2;  // row 7,  col 1
  state[7  * 11 + 10] = 2;  // row 7,  col 10
  state[10 * 11 + 4]  = 2;  // row 10, col 4
  state[10 * 11 + 7]  = 2;  // row 10, col 7
  return state;
}

// arrowValue: 3 = AI arrow (red), 4 = player arrow (blue filled)
export function applyMove(state, startX, startY, endX, endY, arrowX, arrowY, arrowValue = 3) {
  const next = [...state];
  const piece = next[startX * 11 + startY];
  next[startX * 11 + startY] = 0;
  next[endX   * 11 + endY]   = piece;
  next[arrowX * 11 + arrowY] = arrowValue;
  return next;
}

// Returns [[r, c], ...] reachable by queen movement from (x, y).
// vacX/vacY: treat that square as empty (for arrow shots after queen moved).
export function slidingSquares(state, x, y, vacX, vacY) {
  const result = [];
  for (const [dr, dc] of DIRS) {
    let r = x + dr, c = y + dc;
    while (r >= 1 && r <= 10 && c >= 1 && c <= 10) {
      if (r === vacX && c === vacY) {
        result.push([r, c]);
        r += dr; c += dc;
        continue;
      }
      if (state[r * 11 + c] !== 0) break;
      result.push([r, c]);
      r += dr; c += dc;
    }
  }
  return result;
}

export function getAllMoves(state, color) {
  const moves = [];
  for (let r = 1; r <= 10; r++) {
    for (let c = 1; c <= 10; c++) {
      if (state[r * 11 + c] !== color) continue;
      for (const [er, ec] of slidingSquares(state, r, c, -1, -1)) {
        for (const [ar, ac] of slidingSquares(state, er, ec, r, c)) {
          moves.push({ startX: r, startY: c, endX: er, endY: ec, arrowX: ar, arrowY: ac });
        }
      }
    }
  }
  return moves;
}

export function countMobility(state, color) {
  let total = 0;
  for (let r = 1; r <= 10; r++) {
    for (let c = 1; c <= 10; c++) {
      if (state[r * 11 + c] !== color) continue;
      total += slidingSquares(state, r, c, -1, -1).length;
    }
  }
  return total;
}
