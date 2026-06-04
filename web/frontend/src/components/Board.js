import { useState } from 'react';
import '../styles/Board.css';

function Board({ gameState, selectedCell, onSelectCell, onMove, interactive, isAIThinking }) {
  const [movePhase, setMovePhase] = useState(null); // null | 'selecting' | 'shooting'
  const [queenStart, setQueenStart] = useState(null);
  const [queenEnd, setQueenEnd] = useState(null);

  const getCellValue = (row, col) => gameState[row * 11 + col];

  const handleCellClick = (row, col) => {
    if (!interactive) return;
    const value = getCellValue(row, col);

    // Phase 1: select a queen
    if (!queenStart) {
      if (value === 1 || value === 2) {
        setQueenStart({ row, col });
        setMovePhase('selecting');
        onSelectCell({ row, col });
      }
      return;
    }

    // Phase 2: choose queen destination
    if (!queenEnd) {
      if (queenStart.row === row && queenStart.col === col) {
        setQueenStart(null);
        setMovePhase(null);
        onSelectCell(null);
        return;
      }
      if (isValidQueenMove(queenStart, { row, col })) {
        setQueenEnd({ row, col });
        setMovePhase('shooting');
        onSelectCell({ row, col });
      }
      return;
    }

    // Phase 3: shoot arrow (queen's old square is now vacated)
    if (isValidArrowShot(queenEnd, { row, col }, queenStart)) {
      onMove(queenStart.row, queenStart.col, queenEnd.row, queenEnd.col, row, col);
      setQueenStart(null);
      setQueenEnd(null);
      setMovePhase(null);
      onSelectCell(null);
    }
  };

  const isValidQueenMove = (from, to) => {
    const dr = to.row - from.row;
    const dc = to.col - from.col;
    if (dr !== 0 && dc !== 0 && Math.abs(dr) !== Math.abs(dc)) return false;
    const stepR = Math.sign(dr);
    const stepC = Math.sign(dc);
    if (stepR === 0 && stepC === 0) return false;
    let r = from.row + stepR, c = from.col + stepC;
    while (!(r === to.row && c === to.col)) {
      if (getCellValue(r, c) !== 0) return false;
      r += stepR; c += stepC;
    }
    return getCellValue(to.row, to.col) === 0;
  };

  // Arrow shot path treats `vacated` (queen's old square) as empty
  const isValidArrowShot = (from, to, vacated) => {
    const dr = to.row - from.row;
    const dc = to.col - from.col;
    if (dr !== 0 && dc !== 0 && Math.abs(dr) !== Math.abs(dc)) return false;
    if (dr === 0 && dc === 0) return false;
    const stepR = Math.sign(dr);
    const stepC = Math.sign(dc);
    let r = from.row + stepR, c = from.col + stepC;
    while (!(r === to.row && c === to.col)) {
      const isVacated = vacated && r === vacated.row && c === vacated.col;
      if (!isVacated && getCellValue(r, c) !== 0) return false;
      r += stepR; c += stepC;
    }
    const isVacatedTarget = vacated && to.row === vacated.row && to.col === vacated.col;
    return isVacatedTarget || getCellValue(to.row, to.col) === 0;
  };

  const renderCell = (row, col) => {
    const value = getCellValue(row, col);
    const isSelected = selectedCell && selectedCell.row === row && selectedCell.col === col;
    const isLight = (row + col) % 2 === 0;

    const classNames = ['cell', isLight ? 'light-sq' : 'dark-sq'];
    let content = null;

    // Pieces — hide queen at vacated start position while shooting
    if (value === 1) {
      const isVacated = movePhase === 'shooting' && queenStart && row === queenStart.row && col === queenStart.col;
      if (!isVacated) content = <span className="queen black-queen">♛</span>;
    } else if (value === 2) {
      const isVacated = movePhase === 'shooting' && queenStart && row === queenStart.row && col === queenStart.col;
      if (!isVacated) content = <span className="queen white-queen">♕</span>;
    } else if (value === 3) {
      // Player arrow — blue square, no shape
      classNames.push('arrow-cell-player');
    } else if (value === 4) {
      // AI arrow — red with arrow shape
      classNames.push('arrow-cell-ai');
      content = <div className="arrow-block" />;
    }

    if (isSelected) classNames.push('selected');

    // Valid queen destinations (only during queen-selection phase)
    if (movePhase === 'selecting' && queenStart && value === 0 &&
        isValidQueenMove(queenStart, { row, col })) {
      classNames.push('valid-move');
    }

    // Arrow-shooting phase highlights
    if (movePhase === 'shooting' && queenEnd) {
      if (queenEnd.row === row && queenEnd.col === col) {
        classNames.push('queen-position');
      } else if (value !== 3 && value !== 4 && isValidArrowShot(queenEnd, { row, col }, queenStart)) {
        classNames.push('valid-arrow');
      }
    }

    return (
      <div
        key={`${row}-${col}`}
        className={classNames.join(' ')}
        onClick={() => handleCellClick(row, col)}
      >
        {content}
      </div>
    );
  };

  const phaseMsg = () => {
    if (interactive) {
      if (movePhase === 'selecting') return '[ YOUR TURN ]  QUEEN SELECTED — CHOOSE DESTINATION';
      if (movePhase === 'shooting')  return '[ YOUR TURN ]  QUEEN MOVED — SHOOT AN ARROW';
      return '[ YOUR TURN ]  SELECT A QUEEN TO MOVE';
    }
    return isAIThinking ? "[ AI'S TURN ]  COMPUTING MOVE..." : '> STANDBY';
  };

  return (
    <div className="board-container">
      <div className={`phase-info ${interactive ? 'player-phase' : ''} ${!interactive && isAIThinking ? 'ai-phase' : ''}`}>
        {phaseMsg()}
      </div>

      <div className="board">
        {Array.from({ length: 10 }).map((_, row) =>
          Array.from({ length: 10 }).map((_, col) => renderCell(row + 1, col + 1))
        )}
      </div>

      {queenStart && interactive && (
        <button
          className="cancel-btn"
          onClick={() => {
            setQueenStart(null);
            setQueenEnd(null);
            setMovePhase(null);
            onSelectCell(null);
          }}
        >
          CANCEL MOVE
        </button>
      )}
    </div>
  );
}

export default Board;
