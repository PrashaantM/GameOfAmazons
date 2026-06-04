import React, { useState, useEffect } from 'react';
import './App.css';
import Board from './components/Board';

function App() {
  const [gameState, setGameState] = useState(null);
  const [playerColor, setPlayerColor] = useState(1); // 1 = BLACK, 2 = WHITE
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedCell, setSelectedCell] = useState(null);
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  useEffect(() => {
    fetchGameState();
  }, []);

  const fetchGameState = async () => {
    try {
      const response = await fetch(`${API_URL}/api/game/state`);
      const data = await response.json();
      setGameState(data.gameState);
      setMessage('Game started! Black plays first.');
    } catch (error) {
      console.error('Error fetching game state:', error);
      setMessage('Error connecting to server');
    }
  };

  const handleMove = async (startX, startY, endX, endY, arrowX, arrowY) => {
    try {
      const response = await fetch(`${API_URL}/api/game/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startX, startY, endX, endY, arrowX, arrowY })
      });
      const data = await response.json();
      if (data.error) {
        setMessage(`Invalid move: ${data.error}`);
        return;
      }
      setGameState(data.gameState);
      setSelectedCell(null);
      setMessage('Move accepted! AI is thinking...');

      // Get AI move
      setTimeout(() => requestAIMove(), 500);
    } catch (error) {
      console.error('Error making move:', error);
      setMessage('Error making move');
    }
  };

  const requestAIMove = async () => {
    setIsAIThinking(true);
    try {
      const aiColor = playerColor === 1 ? 2 : 1;
      const response = await fetch(`${API_URL}/api/game/ai-move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerColor: aiColor })
      });
      const data = await response.json();
      if (data.error) {
        setMessage(`AI Error: ${data.error}`);
      } else {
        setGameState(data.gameState);
        setMessage(`AI moved: (${data.move.startX},${data.move.startY}) → (${data.move.endX},${data.move.endY}) Arrow: (${data.move.arrowX},${data.move.arrowY})`);
      }
    } catch (error) {
      console.error('Error getting AI move:', error);
      setMessage('Error getting AI move');
    } finally {
      setIsAIThinking(false);
    }
  };

  const handleReset = () => {
    fetchGameState();
    setSelectedCell(null);
    setPlayerColor(playerColor === 1 ? 2 : 1);
  };

  if (!gameState) {
    return <div className="app"><h1>Loading...</h1></div>;
  }

  return (
    <div className="app">
      <h1>🎮 Game of Amazons</h1>
      <div className="info">
        <p className="player-color">
          You are: <strong>{playerColor === 1 ? '⚫ Black' : '⚪ White'}</strong>
        </p>
        <p className="message">{message}</p>
        <div className="controls">
          <button onClick={handleReset} disabled={isAIThinking}>
            New Game
          </button>
        </div>
      </div>
      <Board
        gameState={gameState}
        selectedCell={selectedCell}
        onSelectCell={setSelectedCell}
        onMove={handleMove}
        isAIThinking={isAIThinking}
      />
    </div>
  );
}

export default App;
