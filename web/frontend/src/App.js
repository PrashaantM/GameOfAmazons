import { useState, useEffect, useRef } from 'react';
import './App.css';
import Board from './components/Board';
import { initializeGameState, applyMove, getAllMoves } from './gameLogic';
import { getAIMove } from './aiLogic';

function App() {
  const stateRef = useRef(initializeGameState());
  const [gameState, setGameStateRaw]      = useState(stateRef.current);
  const [playerColor, setPlayerColor]     = useState(1);
  const [isAIThinking, setIsAIThinking]   = useState(false);
  const [message, setMessage]             = useState('[ YOUR TURN — BLACK MOVES FIRST ]');
  const [selectedCell, setSelectedCell]   = useState(null);
  const [gameMode, setGameMode]           = useState('pvai');
  const [aiTurn, setAiTurn]               = useState(1);
  const [aiVsAiRunning, setAiVsAiRunning] = useState(false);
  const [gameOver, setGameOver]           = useState(false);

  const setGameState = (s) => { stateRef.current = s; setGameStateRaw(s); };

  const resetGame = () => {
    const fresh = initializeGameState();
    setGameState(fresh);
    setAiTurn(1);
    setSelectedCell(null);
    setIsAIThinking(false);
    setGameOver(false);
  };

  // AI vs AI loop
  useEffect(() => {
    if (!aiVsAiRunning || isAIThinking || gameOver) return;
    const timer = setTimeout(() => runAITurn(aiTurn), 600);
    return () => clearTimeout(timer);
  }, [aiVsAiRunning, aiTurn, isAIThinking, gameOver]); // eslint-disable-line

  const runAITurn = (color) => {
    setIsAIThinking(true);
    // arrowValue: color 1 → 3 (blue), color 2 → 4 (red) for visual distinction in AI vs AI
    const arrowValue = color === 1 ? 3 : 4;
    setTimeout(() => {
      const current = stateRef.current;
      const move = getAIMove(current, color);
      if (!move) {
        const loser  = color === 1 ? 'BLACK' : 'WHITE';
        const winner = color === 1 ? 'WHITE' : 'BLACK';
        setMessage(`[ GAME OVER — ${loser} HAS NO MOVES. ${winner} WINS ]`);
        setAiVsAiRunning(false);
        setGameOver(true);
      } else {
        const next = applyMove(current, move.startX, move.startY, move.endX, move.endY, move.arrowX, move.arrowY, arrowValue);
        setGameState(next);
        const label = color === 1 ? 'BLACK' : 'WHITE';
        setMessage(`[ ${label}: (${move.startX},${move.startY})→(${move.endX},${move.endY}) arrow(${move.arrowX},${move.arrowY}) ]`);
        setAiTurn(color === 1 ? 2 : 1);
      }
      setIsAIThinking(false);
    }, 0);
  };

  const handlePlayerMove = (startX, startY, endX, endY, arrowX, arrowY) => {
    // Player arrow = value 3 (blue square)
    const afterPlayer = applyMove(stateRef.current, startX, startY, endX, endY, arrowX, arrowY, 3);
    setGameState(afterPlayer);
    setSelectedCell(null);

    const aiColor = playerColor === 1 ? 2 : 1;
    if (getAllMoves(afterPlayer, aiColor).length === 0) {
      setMessage(`[ GAME OVER — ${playerColor === 1 ? 'BLACK' : 'WHITE'} WINS ]`);
      setGameOver(true);
      return;
    }

    setMessage("[ AI'S TURN — THINKING... ]");
    setIsAIThinking(true);
    // Wait 1 second before AI responds so the player can see their move
    setTimeout(() => {
      const move = getAIMove(afterPlayer, aiColor);
      if (!move) {
        setMessage(`[ GAME OVER — ${playerColor === 1 ? 'BLACK' : 'WHITE'} WINS ]`);
        setGameOver(true);
        setIsAIThinking(false);
        return;
      }
      // AI arrow = value 4 (red arrow shape)
      const afterAI = applyMove(afterPlayer, move.startX, move.startY, move.endX, move.endY, move.arrowX, move.arrowY, 4);
      setGameState(afterAI);

      if (getAllMoves(afterAI, playerColor).length === 0) {
        const loser  = playerColor === 1 ? 'BLACK' : 'WHITE';
        const winner = aiColor === 1 ? 'BLACK' : 'WHITE';
        setMessage(`[ GAME OVER — ${loser} HAS NO MOVES. ${winner} WINS ]`);
        setGameOver(true);
      } else {
        setMessage('[ YOUR TURN ]');
      }
      setIsAIThinking(false);
    }, 1000);
  };

  const handleNewGame = () => {
    setAiVsAiRunning(false);
    resetGame();
    if (gameMode === 'aivai') {
      setMessage('[ BLACK MOVES FIRST ]');
      setTimeout(() => setAiVsAiRunning(true), 50);
    } else {
      const next = playerColor === 1 ? 2 : 1;
      setPlayerColor(next);
      setMessage(`[ YOUR TURN — YOU ARE NOW ${next === 1 ? 'BLACK' : 'WHITE'} ]`);
    }
  };

  const handleToggleMode = () => {
    const newMode = gameMode === 'pvai' ? 'aivai' : 'pvai';
    setGameMode(newMode);
    setAiVsAiRunning(false);
    resetGame();
    if (newMode === 'aivai') {
      setMessage('[ AI VS AI — WATCH THE MACHINES BATTLE ]');
      setTimeout(() => setAiVsAiRunning(true), 50);
    } else {
      setMessage('[ YOUR TURN — BLACK MOVES FIRST ]');
    }
  };

  const isInteractive = gameMode === 'pvai' && !isAIThinking && !gameOver;

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
              <li>Player vs AI — you control Black</li>
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
                <div className="legend-cell arrow-ai">
                  <div className="arrow-block-legend" />
                </div>
                <span>AI arrow (red)</span>
              </div>
              <div className="legend-item">
                <div className="legend-cell arrow-player" />
                <span>Your arrow (blue)</span>
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
              <li>Mobility heuristic evaluation</li>
              <li>Runs entirely in your browser</li>
              <li>No server required</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default App;
