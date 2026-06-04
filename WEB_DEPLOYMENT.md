# Game of Amazons - Web Deployment Guide

This guide walks you through deploying your Game of Amazons to make it playable online.

## Architecture

- **Frontend**: React app hosted on GitHub Pages (free, static)
- **Backend**: Node.js server hosted on Railway/Render (free tier available)
- **Java AI**: Runs on backend server

## Prerequisites

- Node.js 16+ and npm
- Java 11+ and Maven
- GitHub account
- Railway or Render account (free tier)
- Git

## Step 1: Frontend Setup (GitHub Pages)

### 1.1 Update GitHub username in frontend config

```bash
cd web/frontend
```

Edit `package.json`:
```json
"homepage": "https://YOUR-GITHUB-USERNAME.github.io/GameOfAmazons",
```

### 1.2 Set the backend API URL

Create `.env.production`:
```
REACT_APP_API_URL=https://your-backend-url.railway.app
```

### 1.3 Build and deploy frontend

```bash
npm install
npm run build
npm run deploy
```

This automatically pushes the build folder to `gh-pages` branch on GitHub.

**Enable GitHub Pages:**
1. Go to Settings → Pages
2. Select "Deploy from a branch"
3. Choose `gh-pages` branch

Your frontend will be live at: `https://YOUR-GITHUB-USERNAME.github.io/GameOfAmazons`

---

## Step 2: Backend Deployment (Railway)

### 2.1 Install Railway CLI

```bash
npm install -g @railway/cli
```

### 2.2 Build Java classes

```bash
cd ../../COSC322_Project/cosc_322_project
mvn clean package -DskipTests
```

This creates the compiled classes needed by the backend.

### 2.3 Deploy to Railway

```bash
cd ../../web/backend
railway login
railway init
```

During `railway init`:
- Choose "Create a new project"
- Name it `amazons-game`
- Choose Node.js

### 2.4 Set environment variables

```bash
railway variables:set CORS_ORIGIN=https://YOUR-GITHUB-USERNAME.github.io
```

### 2.5 Deploy

```bash
railway up
```

### 2.6 Get your backend URL

```bash
railway domains
```

You'll see your URL like: `https://amazons-game-production.railway.app`

---

## Step 3: Connect Frontend to Backend

### 3.1 Update frontend environment

In `web/frontend/.env.production`:
```
REACT_APP_API_URL=https://your-railway-url.railway.app
```

### 3.2 Rebuild and redeploy

```bash
cd web/frontend
npm run build
npm run deploy
```

---

## Alternative: Deploy Backend to Render

If you prefer Render instead:

### 1. Push code to GitHub

```bash
git add web/
git commit -m "Add web integration"
git push -u origin web-integration
```

### 2. Create Render service

1. Go to [render.com](https://render.com)
2. Click "New +"
3. Select "Web Service"
4. Connect your GitHub repo
5. Select the `web/backend` directory
6. Set build command: `npm install && mvn package -DskipTests`
7. Set start command: `npm start`
8. Add environment variable: `NODE_ENV=production`

### 3. Get your URL and use in frontend

---

## Troubleshooting

### Java not found in backend

Make sure you built the Java project before deploying:
```bash
cd COSC322_Project/cosc_322_project
mvn clean package -DskipTests
```

### CORS errors

Update the backend `.env`:
```
CORS_ORIGIN=https://YOUR-GITHUB-USERNAME.github.io
```

### AI moves not showing

Check backend logs. Make sure the Java classpath in `server.js` is correct.

---

## Local Development

To test locally before deploying:

### Terminal 1: Start backend
```bash
cd web/backend
npm install
node server.js
```

### Terminal 2: Start frontend
```bash
cd web/frontend
npm install
npm start
```

Visit `http://localhost:3000`

---

## Game Rules (for reference)

- **Board**: 10x10 grid with 4 queens per player
- **Move**: Queens move like chess queens (any straight line)
- **Arrow**: After moving, shoot an arrow (blocks that square)
- **Win**: Opponent has no legal moves

---

## Security Notes

- The backend runs your Java code on a public server
- No user data is stored
- Each game is isolated in memory
- Consider rate limiting in production

---

## Next Steps

1. Deploy frontend to GitHub Pages
2. Deploy backend to Railway/Render
3. Test the game at your public URL
4. Share it! 🎮
