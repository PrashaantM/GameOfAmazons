import { useState, useEffect, useRef } from 'react';
import './App.css';
import Board from './components/Board';
import { initializeGameState, applyMove, getAllMoves } from './gameLogic';
import { getAIMove } from './aiLogic';

function App() {
  const stateRef = useRef(initializeGameState());
  const [gameState, setGameStateRaw]    = useState(stateRef.current);
  const [playerColor, setPlayerColor]   = useState(1);   // 1=BLACK, 2=WHITE
  const [currentTurn, setCurrentTurn]   = useState(1);   // whose turn it is right now
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [message, setMessage]           = useState('[ BLACK MOVES FIRST — YOU ARE BLACK ]');
  const [selectedCell, setSelectedCell] = useState(null);
  const [gameMode, setGameMode]         = useState('pvai');
  const [aiVsAiRunning, setAiVsAiRunning] = useState(false);
  const [gameOver, setGameOver]         = useState(false);

  const setGameState = (s) => { stateRef.current = s; setGameStateRaw(s); };

  const resetGame = () => {
    const fresh = initializeGameState();
    stateRef.current = fresh;
    setGameStateRaw(fresh);
    setSelectedCell(null);
    setIsAIThinking(false);
    setGameOver(false);
    setCurrentTurn(1); // BLACK always opens
  };

  // ── Player vs AI — AI turn handler ──────────────────────────────────────
  // Fires whenever currentTurn flips to the AI's color.
  // Uses a minimum 1-second delay so the AI visibly "thinks."
  useEffect(() => {
    if (gameMode !== 'pvai' || isAIThinking || gameOver) return;
    if (currentTurn === playerColor) return; // player's turn — do nothing

    const aiColor = currentTurn;
    setIsAIThinking(true);
    setMessage('[ AI THINKING... ]');

    const timer = setTimeout(() => {
      const current = stateRef.current;
      const move    = getAIMove(current, aiColor);

      if (!move) {
        const winner = playerColor === 1 ? 'BLACK' : 'WHITE';
        setMessage(`[ GAME OVER — AI HAS NO MOVES. ${winner} WINS ]`);
        setGameOver(true);
        setIsAIThinking(false);
        return;
      }

      // arrowValue 3 = AI arrow (rendered as red arrow shape)
      const afterAI = applyMove(
        current,
        move.startX, move.startY,
        move.endX,   move.endY,
        move.arrowX, move.arrowY,
        3
      );
      setGameState(afterAI);
      const label = aiColor === 1 ? 'BLACK' : 'WHITE';
      setMessage(
        `[ ${label}: (${move.startX},${move.startY})→(${move.endX},${move.endY}) ` +
        `arrow(${move.arrowX},${move.arrowY}) ]`
      );

      if (getAllMoves(afterAI, playerColor).length === 0) {
        const loser  = playerColor === 1 ? 'BLACK' : 'WHITE';
        const winner = aiColor === 1 ? 'BLACK' : 'WHITE';
        setMessage(`[ GAME OVER — ${loser} HAS NO MOVES. ${winner} WINS ]`);
        setGameOver(true);
        setIsAIThinking(false);
        return;
      }

      setCurrentTurn(playerColor); // hand back to human
      setIsAIThinking(false);
    }, 1000); // minimum 1-second wait

    return () => clearTimeout(timer);
  }, [currentTurn, playerColor, gameMode, isAIThinking, gameOver]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── AI vs AI loop ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!aiVsAiRunning || isAIThinking || gameOver) return;

    const timer = setTimeout(() => {
      setIsAIThinking(true);

      // Yield to React so "thinking" renders before heavy computation
      setTimeout(() => {
        const current = stateRef.current;
        const color   = currentTurn;
        const move    = getAIMove(current, color);

        if (!move) {
          const loser  = color === 1 ? 'BLACK' : 'WHITE';
          const winner = color === 1 ? 'WHITE' : 'BLACK';
          setMessage(`[ GAME OVER — ${loser} HAS NO MOVES. ${winner} WINS ]`);
          setAiVsAiRunning(false);
          setGameOver(true);
        } else {
          const next = applyMove(
            current,
            move.startX, move.startY,
            move.endX,   move.endY,
            move.arrowX, move.arrowY,
            3
          );
          setGameState(next);
          const label = color === 1 ? 'BLACK' : 'WHITE';
          setMessage(
            `[ ${label}: (${move.startX},${move.startY})→(${move.endX},${move.endY}) ` +
            `arrow(${move.arrowX},${move.arrowY}) ]`
          );
          setCurrentTurn(color === 1 ? 2 : 1);
        }
        setIsAIThinking(false);
      }, 0);
    }, 600);

    return () => clearTimeout(timer);
  }, [aiVsAiRunning, currentTurn, isAIThinking, gameOver]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Player move callback (called by Board) ───────────────────────────────
  const handlePlayerMove = (startX, startY, endX, endY, arrowX, arrowY) => {
    // arrowValue 4 = player arrow (rendered as solid blue square)
    const afterPlayer = applyMove(
      stateRef.current,
      startX, startY,
      endX,   endY,
      arrowX, arrowY,
      4
    );
    setGameState(afterPlayer);
    setSelectedCell(null);

    const aiColor = playerColor === 1 ? 2 : 1;
    if (getAllMoves(afterPlayer, aiColor).length === 0) {
      const winner = playerColor === 1 ? 'BLACK' : 'WHITE';
      setMessage(`[ GAME OVER — ${winner} WINS! AI HAS NO MOVES ]`);
      setGameOver(true);
      return;
    }

    setCurrentTurn(aiColor); // triggers the pvai AI useEffect
  };

  // ── New Game ─────────────────────────────────────────────────────────────
  const handleNewGame = () => {
    setAiVsAiRunning(false);
    if (gameMode === 'aivai') {
      resetGame();
      setMessage('[ BLACK MOVES FIRST ]');
      setTimeout(() => setAiVsAiRunning(true), 50);
    } else {
      const next = playerColor === 1 ? 2 : 1;
      setPlayerColor(next);
      resetGame();
      if (next === 1) {
        setMessage('[ NEW GAME — YOU ARE BLACK. YOUR TURN ]');
      } else {
        setMessage('[ NEW GAME — YOU ARE WHITE. AI (BLACK) MOVES FIRST... ]');
      }
      // resetGame sets currentTurn=1; if next===2, the pvai AI effect fires automatically
    }
  };

  // ── Toggle Mode ──────────────────────────────────────────────────────────
  const handleToggleMode = () => {
    const newMode = gameMode === 'pvai' ? 'aivai' : 'pvai';
    setGameMode(newMode);
    setPlayerColor(1); // reset to BLACK on every mode switch
    setAiVsAiRunning(false);
    resetGame();
    if (newMode === 'aivai') {
      setMessage('[ AI VS AI — WATCH THE MACHINES BATTLE ]');
      setTimeout(() => setAiVsAiRunning(true), 50);
    } else {
      setMessage('[ BLACK MOVES FIRST — YOU ARE BLACK ]');
    }
  };

  // Board is interactive only in pvai mode, during the human's turn,
  // when not game-over and not waiting for AI.
  const isInteractive =
    gameMode === 'pvai' &&
    !isAIThinking       &&
    !gameOver           &&
    currentTurn === playerColor;

  return (
    <div className="app">
      <h1>{'// GAME OF AMAZONS'}</h1>

      <div className="controls-bar">
        <button onClick={handleNewGame} disabled={isAIThinking}>
          NEW GAME
        </button>
        <button
          className={gameMode === 'aivai' ? 'active' : ''}
          onClick={handleToggleMode}
          disabled={isAIThinking}
        >
          {gameMode === 'pvai' ? 'WATCH AI VS AI' : 'PLAY VS AI'}
        </button>
        {gameMode === 'pvai' && (
          <span className="mode-tag">
            PLAYING AS: {playerColor === 1 ? '⬛ BLACK' : '⬜ WHITE'}
          </span>
        )}
        {gameMode === 'aivai' && (
          <span className={`mode-tag${aiVsAiRunning ? ' live' : ''}`}>
            {aiVsAiRunning ? '◉ LIVE' : '◎ IDLE'}
          </span>
        )}
      </div>

      <div className="game-area">
        <div className="board-section">
          <p className={`status-msg${isAIThinking ? ' thinking' : ''}`}>{message}</p>
          <Board
            gameState={gameState}
            playerColor={playerColor}
            selectedCell={selectedCell}
            onSelectCell={setSelectedCell}
            onMove={handlePlayerMove}
            interactive={isInteractive}
            isAIThinking={isAIThinking}
          />
        </div>

        <aside className="sidebar">
          <div className="instructions">
            <h2>HOW TO PLAY</h2>

            <h3>OBJECTIVE</h3>
            <ul>
              <li>Block all opponent queens so they can't move</li>
              <li>The player with no legal moves loses</li>
            </ul>

            <h3>YOUR TURN (3 steps)</h3>
            <ul>
              <li>Click a queen to select it</li>
              <li>Click an empty square to move it there</li>
              <li>Click to shoot an arrow from that square</li>
            </ul>

            <h3>MOVEMENT RULES</h3>
            <ul>
              <li>Queens move like chess queens</li>
              <li>Any distance: ↕ ↔ ↗ ↘</li>
              <li>Cannot jump over pieces or arrows</li>
              <li>Arrows permanently block squares forever</li>
            </ul>

            <h3>MODES</h3>
            <ul>
              <li>Player vs AI — alternate Black / White each new game</li>
              <li>AI vs AI — watch two engines battle</li>
            </ul>

            <h3>LEGEND</h3>
            <div className="legend">
              <div className="legend-item">
                <div className="legend-cell">♛</div>
                <span>Black queen</span>
              </div>
              <div className="legend-item">
                <div className="legend-cell">♕</div>
                <span>White queen</span>
              </div>
              <div className="legend-item">
                <div className="legend-cell arrow">
                  <div className="arrow-block-legend" />
                </div>
                <span>AI arrow — blocked forever</span>
              </div>
              <div className="legend-item">
                <div className="legend-cell player-arrow-legend" />
                <span>Your arrow — blocked forever</span>
              </div>
              <div className="legend-item">
                <div className="legend-cell sel" />
                <span>Selected / queen moved</span>
              </div>
              <div className="legend-item">
                <div className="legend-cell vmove" />
                <span>Valid queen destination</span>
              </div>
              <div className="legend-item">
                <div className="legend-cell varrow" />
                <span>Valid arrow target</span>
              </div>
            </div>

            <h3>AI ENGINE</h3>
            <ul>
              <li>Minimax + alpha-beta pruning (depth 2)</li>
              <li>Mobility heuristic evaluation</li>
              <li>Runs entirely in your browser</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default App;
