import React, { useState } from 'react';
import '../styles/Board.css';

function Board({ gameState, selectedCell, onSelectCell, onMove, isAIThinking }) {
  const [movePhase, setMovePhase] = useState(null); // 'selecting', 'moving', 'shooting'
  const [queenStart, setQueenStart] = useState(null);
  const [queenEnd, setQueenEnd] = useState(null);

  const getCellValue = (row, col) => {
    const index = row * 11 + col;
    return gameState[index];
  };

  const handleCellClick = (row, col) => {
    if (isAIThinking) return;

    const value = getCellValue(row, col);

    // Phase 1: Select queen
    if (!queenStart) {
      if (value === 1 || value === 2) {
        setQueenStart({ row, col });
        setMovePhase('selecting');
        onSelectCell({ row, col });
      }
      return;
    }

    // Phase 2: Move queen
    if (!queenEnd) {
      if (queenStart.row === row && queenStart.col === col) {
        // Deselect
        setQueenStart(null);
        setMovePhase(null);
        onSelectCell(null);
        return;
      }
      if (isValidQueenMove(queenStart, { row, col })) {
        setQueenEnd({ row, col });
        setMovePhase('moving');
        onSelectCell({ row, col });
      }
      return;
    }

    // Phase 3: Shoot arrow
    if (isValidArrowMove(queenEnd, { row, col })) {
      const move = {
        startX: queenStart.row,
        startY: queenStart.col,
        endX: queenEnd.row,
        endY: queenEnd.col,
        arrowX: row,
        arrowY: col
      };
      onMove(move.startX, move.startY, move.endX, move.endY, move.arrowX, move.arrowY);

      // Reset
      setQueenStart(null);
      setQueenEnd(null);
      setMovePhase(null);
      onSelectCell(null);
    }
  };

  const isValidQueenMove = (from, to) => {
    const dr = to.row - from.row;
    const dc = to.col - from.col;

    // Must move in straight line (horizontal, vertical, or diagonal)
    if (dr !== 0 && dc !== 0 && Math.abs(dr) !== Math.abs(dc)) return false;

    // Path must be clear
    const stepR = Math.sign(dr);
    const stepC = Math.sign(dc);
    let r = from.row + stepR;
    let c = from.col + stepC;

    while (!(r === to.row && c === to.col)) {
      if (getCellValue(r, c) !== 0) return false;
      r += stepR;
      c += stepC;
    }

    // Target must be empty
    return getCellValue(to.row, to.col) === 0;
  };

  const isValidArrowMove = (from, to) => {
    const dr = to.row - from.row;
    const dc = to.col - from.col;

    if (dr !== 0 && dc !== 0 && Math.abs(dr) !== Math.abs(dc)) return false;
    if (dr === 0 && dc === 0) return false;

    const stepR = Math.sign(dr);
    const stepC = Math.sign(dc);
    let r = from.row + stepR;
    let c = from.col + stepC;

    while (!(r === to.row && c === to.col)) {
      if (getCellValue(r, c) !== 0) return false;
      r += stepR;
      c += stepC;
    }

    return getCellValue(to.row, to.col) === 0;
  };

  const renderCell = (row, col) => {
    const value = getCellValue(row, col);
    const isSelected = selectedCell && selectedCell.row === row && selectedCell.col === col;

    let content = '';
    let className = 'cell';

    if (value === 1) content = '♛'; // Black queen
    else if (value === 2) content = '♕'; // White queen
    else if (value === 3) content = '💣'; // Arrow

    if (isSelected) className += ' selected';
    if (movePhase === 'moving' && queenStart && isValidQueenMove(queenStart, { row, col })) {
      className += ' valid-move';
    }
    if (movePhase === 'moving' && queenEnd && queenEnd.row === row && queenEnd.col === col) {
      className += ' queen-position';
    }
    if (movePhase === 'moving' && queenEnd && isValidArrowMove(queenEnd, { row, col })) {
      className += ' valid-arrow';
    }

    return (
      <div
        key={`${row}-${col}`}
        className={className}
        onClick={() => handleCellClick(row, col)}
      >
        {content}
      </div>
    );
  };

  return (
    <div className="board-container">
      <div className="phase-info">
        {movePhase === 'selecting' && <span>📍 Select queen - click to move</span>}
        {movePhase === 'moving' && <span>🎯 Click destination to move queen</span>}
        {movePhase === 'moving' && queenEnd && <span>🏹 Click to shoot arrow</span>}
        {!movePhase && <span>Select a queen to move</span>}
      </div>
      <div className="board">
        {Array.from({ length: 10 }).map((_, row) =>
          Array.from({ length: 10 }).map((_, col) => renderCell(row + 1, col + 1))
        )}
      </div>
      {queenStart && (
        <button
          onClick={() => {
            setQueenStart(null);
            setQueenEnd(null);
            setMovePhase(null);
            onSelectCell(null);
          }}
          className="cancel-btn"
        >
          Cancel Move
        </button>
      )}
    </div>
  );
}

export default Board;
