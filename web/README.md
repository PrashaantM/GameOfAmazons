# Game of Amazons - Web Integration

This directory contains the web interface to play Game of Amazons against your Java AI agent.

## Structure

```
web/
├── backend/           # Node.js/Express server
│   ├── server.js      # Main API server
│   └── package.json
├── frontend/          # React web app
│   ├── src/
│   │   ├── App.js     # Main game component
│   │   ├── components/Board.js
│   │   └── styles/
│   └── package.json
└── java-ai-wrapper/   # Java CLI wrapper
    └── AmazonsCLI.java
```

## Quick Start (Local Development)

### Terminal 1: Build Java and start backend
```bash
# Build Java classes first
cd ../COSC322_Project/cosc_322_project
mvn clean package -DskipTests

# Start backend
cd ../../web/backend
npm install
npm start
```

Backend runs at `http://localhost:5000`

### Terminal 2: Start frontend
```bash
cd web/frontend
npm install
npm start
```

Frontend opens at `http://localhost:3000`

## How It Works

1. **React Frontend** - Displays the game board, handles user moves
2. **Express Backend** - Manages game state, calls Java AI
3. **Java AI** - Your existing AI engine returns the best move

### Move Flow
```
User clicks cells
    ↓
Frontend sends move to backend API
    ↓
Backend applies move and calls Java AI
    ↓
Java AI returns best move (as JSON)
    ↓
Backend applies AI move to game state
    ↓
Frontend receives updated state and renders
```

## Deployment

See `../WEB_DEPLOYMENT.md` for full deployment instructions.

**TL;DR:**
1. Frontend → GitHub Pages (free)
2. Backend → Railway or Render (free tier)

## Game Rules

- **Setup**: 10x10 board, 2 players with 4 queens each
- **Turn**: Move queen (like chess) → Shoot arrow
- **Win**: Opponent has no legal moves

## Notes

- All game logic runs on the backend
- Moves are validated before applying
- AI response includes coordinates in 0-based indexing
- CORS is enabled for cross-origin requests

## Troubleshooting

**Java not found?**
```bash
# Make sure to build first
cd COSC322_Project/cosc_322_project
mvn clean package -DskipTests
```

**Backend not starting?**
```bash
# Check Node version (need 14+)
node --version

# Check Java classpath in server.js matches your build
```

**Moves not validating?**
Check the `isValidMove` function in `backend/server.js` - it has basic validation but you may want to enhance it.

## Next Steps

1. ✅ Test locally
2. ✅ Deploy frontend to GitHub Pages
3. ✅ Deploy backend to Railway/Render
4. ✅ Share your game!

Good luck! 🎮
