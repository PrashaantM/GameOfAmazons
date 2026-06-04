import express from 'express';
import cors from 'cors';
import { execSync, spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Game state management
let gameState = initializeGameState();

function initializeGameState() {
  const state = new Array(121).fill(0);
  // Black queens at corners
  state[1 * 11 + 1] = 1;
  state[1 * 11 + 9] = 1;
  state[9 * 11 + 1] = 1;
  state[9 * 11 + 9] = 1;
  // White queens at opposite corners
  state[1 * 11 + 5] = 2;
  state[1 * 11 + 10] = 2;
  state[9 * 11 + 5] = 2;
  state[9 * 11 + 10] = 2;
  return state;
}

function callJavaAI(playerColor) {
  try {
    const javaPath = path.join(__dirname, '../java-ai-wrapper');
    const classPath = path.join(__dirname, '../../COSC322_Project/cosc_322_project/target/classes') + ':' +
                      path.join(__dirname, '../../COSC322_Project/cosc_322_project/lib/*');

    const gameStateJson = JSON.stringify(gameState);
    const cmd = `java -cp "${classPath}" ubc.cosc322.AmazonsCLI ${playerColor} '${gameStateJson}'`;

    const output = execSync(cmd, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
    return JSON.parse(output.trim());
  } catch (error) {
    console.error('Error calling Java AI:', error.message);
    return { error: 'Failed to get AI move', details: error.message };
  }
}

app.get('/api/game/state', (req, res) => {
  res.json({ gameState });
});

app.post('/api/game/move', (req, res) => {
  const { startX, startY, endX, endY, arrowX, arrowY } = req.body;

  // Validate move
  if (!isValidMove(startX, startY, endX, endY, arrowX, arrowY)) {
    return res.status(400).json({ error: 'Invalid move' });
  }

  applyMove(startX, startY, endX, endY, arrowX, arrowY);
  res.json({ gameState, success: true });
});

app.post('/api/game/ai-move', (req, res) => {
  const { playerColor } = req.body;

  if (!playerColor || (playerColor !== 1 && playerColor !== 2)) {
    return res.status(400).json({ error: 'Invalid player color' });
  }

  const move = callJavaAI(playerColor);

  if (move.error) {
    return res.json(move);
  }

  applyMove(move.startX, move.startY, move.endX, move.endY, move.arrowX, move.arrowY);
  res.json({ move, gameState, success: true });
});

app.post('/api/game/reset', (req, res) => {
  gameState = initializeGameState();
  res.json({ gameState });
});

function applyMove(startX, startY, endX, endY, arrowX, arrowY) {
  const startIdx = startX * 11 + startY;
  const endIdx = endX * 11 + endY;
  const arrowIdx = arrowX * 11 + arrowY;

  const queenValue = gameState[startIdx];
  gameState[startIdx] = 0;
  gameState[endIdx] = queenValue;
  gameState[arrowIdx] = 3; // Arrow
}

function isValidMove(startX, startY, endX, endY, arrowX, arrowY) {
  // Basic validation - in production, add full rule checking
  const startIdx = startX * 11 + startY;
  const endIdx = endX * 11 + endY;

  if (startIdx < 0 || startIdx >= 121 || endIdx < 0 || endIdx >= 121) return false;
  if (gameState[startIdx] === 0 || gameState[startIdx] === 3) return false;
  if (gameState[endIdx] !== 0) return false;

  return true;
}

app.listen(PORT, () => {
  console.log(`Amazons AI server running on port ${PORT}`);
});
