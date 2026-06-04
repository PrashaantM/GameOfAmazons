# ⚡ Quick Deploy Guide - Game of Amazons

Your **frontend is already deployed** to GitHub Pages! 🎉

## Your Game is Live At:
```
https://PrashaantM.github.io/GameOfAmazons
```

You can visit it right now in your browser! 🎮

## Complete the Setup (1 Step Remaining)

The frontend is working, but it needs a backend to call the AI. Deploy the backend to Railway (takes 2 minutes):

### Step 1: Create Railway Account
Go to https://railway.app and sign up (free tier available)

### Step 2: Deploy Backend
```bash
cd web/backend
npm install
railway login
railway init
```

When prompted:
- Choose "Create a new project"
- Name: `amazons-game`
- Language: Node.js

Then deploy:
```bash
railway up
```

### Step 3: Get Your Backend URL
```bash
railway domains
```

Copy your URL (looks like: `https://amazons-game-production.railway.app`)

### Step 4: Connect Frontend to Backend
Edit `web/frontend/.env.production`:
```
REACT_APP_API_URL=https://your-railway-url.railway.app
```

Rebuild and deploy:
```bash
cd web/frontend
npm run build
npm run deploy
```

## Done! 🚀

Your game is now fully playable at:
https://PrashaantM.github.io/GameOfAmazons

---

## Troubleshooting

**"Connection refused"?**
- Make sure you deployed the backend and have the correct URL

**"AI moves not working"?**
- Check that Java classes are compiled:
  ```bash
  ls COSC322_Project/cosc_322_project/target/classes/ubc/cosc322/
  ```

**Need help?**
- See WEB_DEPLOYMENT.md for detailed instructions

---

## What You Can Do Now

- ✅ Play against the AI online
- ✅ Share the link with anyone
- ✅ Deploy from your phone (just visit the URL)
- ✅ No installation needed for players

Enjoy! 🎮
