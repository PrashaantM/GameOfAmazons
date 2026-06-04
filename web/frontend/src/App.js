import { useState, useEffect } from 'react';
import './App.css';
import Board from './components/Board';

function App() {
  const [gameState, setGameState]       = useState(null);
  const [playerColor, setPlayerColor]   = useState(1);
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [message, setMessage]           = useState('');
  const [selectedCell, setSelectedCell] = useState(null);
  const [gameMode, setGameMode]         = useState('pvai'); // 'pvai' | 'aivai'
  const [aiTurn, setAiTurn]             = useState(1);      // whose turn in aivai
  const [aiVsAiRunning, setAiVsAiRunning] = useState(false);
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  // Kick off initial game on mount
  useEffect(() => {
    resetToServer().then(() => setMessage('[ BLACK MOVES FIRST ]'));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // AI vs AI engine — fires whenever it's a new turn and nothing is blocking
  useEffect(() => {
    if (!aiVsAiRunning || isAIThinking) return;
    const timer = setTimeout(() => doAIMove(aiTurn), 800);
    return () => clearTimeout(timer);
  }, [aiVsAiRunning, aiTurn, isAIThinking]); // eslint-disable-line react-hooks/exhaustive-deps

  const resetToServer = async () => {
    const res  = await fetch(`${API_URL}/api/game/reset`, { method: 'POST' });
    const data = await res.json();
    setGameState(data.gameState);
    setAiTurn(1);
    setSelectedCell(null);
    setIsAIThinking(false);
  };

  const doAIMove = async (color) => {
    setIsAIThinking(true);
    try {
      const res  = await fetch(`${API_URL}/api/game/ai-move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerColor: color }),
      });
      const data = await res.json();
      if (data.error) {
        const loser  = color === 1 ? 'BLACK' : 'WHITE';
        const winner = color === 1 ? 'WHITE' : 'BLACK';
        setMessage(`[ GAME OVER — ${loser} has no moves. ${winner} WINS ]`);
        setAiVsAiRunning(false);
      } else {
        setGameState(data.gameState);
        const { startX, startY, endX, endY, arrowX, arrowY } = data.move;
        const c = color === 1 ? 'BLACK' : 'WHITE';
        setMessage(`[ ${c}: (${startX},${startY})→(${endX},${endY}) arrow(${arrowX},${arrowY}) ]`);
        setAiTurn(color === 1 ? 2 : 1);
      }
    } catch {
      setMessage('[ ERROR: AI move failed ]');
      setAiVsAiRunning(false);
    } finally {
      setIsAIThinking(false);
    }
  };

  const handlePlayerMove = async (startX, startY, endX, endY, arrowX, arrowY) => {
    try {
      const res  = await fetch(`${API_URL}/api/game/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startX, startY, endX, endY, arrowX, arrowY }),
      });
      const data = await res.json();
      if (data.error) {
        setMessage(`[ INVALID MOVE: ${data.error} ]`);
        return;
      }
      setGameState(data.gameState);
      setSelectedCell(null);
      setMessage('[ AI THINKING... ]');
      const aiColor = playerColor === 1 ? 2 : 1;
      setTimeout(() => doAIMove(aiColor), 400);
    } catch {
      setMessage('[ ERROR: move failed ]');
    }
  };

  const handleNewGame = async () => {
    setAiVsAiRunning(false);
    await resetToServer();
    if (gameMode === 'aivai') {
      setMessage('[ BLACK MOVES FIRST ]');
      setAiVsAiRunning(true);
    } else {
      const next = playerColor === 1 ? 2 : 1;
      setPlayerColor(next);
      setMessage(`[ YOU ARE NOW ${next === 1 ? 'BLACK' : 'WHITE'} — BLACK MOVES FIRST ]`);
    }
  };

  const handleToggleMode = async () => {
    const newMode = gameMode === 'pvai' ? 'aivai' : 'pvai';
    setGameMode(newMode);
    setAiVsAiRunning(false);
    await resetToServer();
    if (newMode === 'aivai') {
      setMessage('[ AI VS AI — WATCH THE MACHINES BATTLE ]');
      setAiVsAiRunning(true);
    } else {
      setMessage('[ BLACK MOVES FIRST ]');
    }
  };

  if (!gameState) {
    return (
      <div className="app">
        <p className="loading">{'> INITIALIZING GAME ENGINE...'}</p>
      </div>
    );
  }

  const isInteractive = gameMode === 'pvai' && !isAIThinking;

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
              <li>AI vs AI — watch two MCTS engines battle</li>
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
                <span>Arrow — blocked forever</span>
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
              <li>MCTS (Monte Carlo Tree Search)</li>
              <li>~10s think time per move</li>
              <li>Parallelized across CPU cores</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default App;
