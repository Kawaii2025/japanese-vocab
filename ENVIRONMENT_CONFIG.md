# Environment Configuration Guide

## Overview

This project uses different database configurations based on the deployment environment:

- **Local Development**: SQLite (fast, no external dependencies)
- **GitHub Pages (Production)**: Neon PostgreSQL (cloud database)

## Environment Files

### `.env.development` (Local Development)
```env
VITE_API_BASE_URL=http://localhost:3001/api
```

**Used when**:
- Running `npm run dev` locally
- Running local tests
- Developing features

**Backend**: Your local Express.js server with SQLite database

### `.env.production` (GitHub Pages)
```env
VITE_API_BASE_URL=https://japanese-vocab-three.vercel.app/api
```

**Used when**:
- Building with `npm run build` (production flag)
- GitHub Actions deployment workflow
- GitHub Pages deployment

**Backend**: Deployed Vercel server with Neon PostgreSQL database

## How It Works

### 1. **Local Development Flow**
```
npm run dev
    ↓
Loads .env.development
    ↓
Frontend connects to http://localhost:3001/api
    ↓
Your local Express.js server (api/server.js)
    ↓
SQLite database (/data/vocabulary.db)
```

### 2. **GitHub Pages Production Flow**
```
git push origin main
    ↓
GitHub Actions triggers deploy.yml
    ↓
npm run build with NODE_ENV=production
    ↓
Loads .env.production
    ↓
Frontend built with API endpoint: https://japanese-vocab-three.vercel.app/api
    ↓
Deployed to GitHub Pages
    ↓
GitHub Pages frontend connects to Vercel backend
    ↓
Vercel backend uses Neon PostgreSQL
```

## Setup Instructions

### Step 1: Local Development (SQLite)

1. Start your local API server:
```bash
cd api
npm install
npm run start
```

2. In a new terminal, start the frontend:
```bash
npm install
npm run dev
```

3. Open `http://localhost:5173` - it will use your local SQLite database ✅

### Step 2: Production Backend (Neon on Vercel)

If you don't have a Vercel backend deployed yet, here's how to set it up:

#### Option A: Deploy the API to Vercel

1. Create a `api/vercel.json`:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "server.js"
    }
  ]
}
```

2. Create `api/.env.production` with your Neon credentials:
```env
DATABASE_URL=postgresql://user:password@host.neon.tech/database
PORT=3001
```

3. Deploy to Vercel:
```bash
cd api
vercel --prod
```

4. Get your Vercel URL (e.g., `https://japanese-vocab-three.vercel.app`)

5. Update the frontend's `.env.production`:
```env
VITE_API_BASE_URL=https://japanese-vocab-three.vercel.app/api
```

#### Option B: Use Another Service (Railway, Render, Fly.io)

Follow similar steps for your preferred platform, then update `.env.production` with your API URL.

### Step 3: Verify Configuration

**Local verification**:
```bash
# Should show localhost
cat .env.development
# VITE_API_BASE_URL=http://localhost:3001/api ✅

# Should show Vercel/production server
cat .env.production
# VITE_API_BASE_URL=https://japanese-vocab-three.vercel.app/api ✅
```

**GitHub Pages verification**:
1. Push your changes: `git push origin main`
2. Check GitHub Actions: Settings → Actions
3. View the workflow output - should show it's using `.env.production`
4. Visit your GitHub Pages URL: `https://kawaii2025.github.io/japanese-vocab/`
5. Open browser DevTools → Application/Network tab
6. Check that API calls go to your Vercel backend ✅

## Switching Environments

### Running Production Build Locally
```bash
# Build with production configuration
npm run build

# Preview production build
npm run preview

# This will use the API endpoint from .env.production
```

### Reverting to Development
```bash
# Run development server
npm run dev
# This will use the API endpoint from .env.development
```

## 🔐 Syncing Configuration: `.env.neon`

For syncing data between SQLite and Neon, you need a separate `.env.neon` file:

### What is `.env.neon`?

- **Purpose**: Stores Neon database credentials for syncing operations only
- **Location**: `api/.env.neon`
- **Security**: Added to `.gitignore` - never committed to git
- **Why separate**: Keeps production credentials out of version control

### Setup `.env.neon`

1. Navigate to the API folder:
```bash
cd api
```

2. Get your Neon connection string from your Neon dashboard

3. Create `.env.neon`:
```env
DATABASE_URL=postgresql://neondb_owner:npg_xxxxxxxxxxxx@ep-damp-math-ahvdmdkf-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

### Using `.env.neon`

Once set up, syncing is automatic - no need to manually edit `.env`:

```bash
cd api
npm run sync-neon  # Automatically loads DATABASE_URL from .env.neon
```

For detailed sync instructions, see [NEON_BACKUP_SYNC_GUIDE.md](./NEON_BACKUP_SYNC_GUIDE.md#%EF%B8%8F-initial-setup-configure-neon)

## Troubleshooting

### ❓ GitHub Pages shows blank page or "Cannot GET"
**Cause**: Frontend building with wrong API endpoint  
**Solution**:
```bash
# Check that .env.production exists and has correct endpoint
cat .env.production

# Verify in GitHub Actions logs that .env.production was loaded
```

### ❓ API calls failing even though setup looks correct
**Cause**: CORS issues between GitHub Pages and backend  
**Solution**: Add CORS headers to your Vercel backend:
```javascript
// In api/server.js
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});
```

### ❓ Local development works but GitHub Pages doesn't
**Cause**: Neon backend might be sleeping or API URL incorrect  
**Solution**:
1. Verify Vercel backend is running: `curl https://japanese-vocab-three.vercel.app/api/vocabulary`
2. Check Neon database is active in Neon console
3. Verify VITE_API_BASE_URL doesn't have trailing slash issues

### ❓ Can't connect to local SQLite on GitHub Pages (obvious, but worth noting!)
**Explanation**: GitHub Pages can only run static content. It can't run your Express.js server or access local SQLite. That's why production uses Neon instead.

## Architecture Comparison

| Feature | Local (SQLite) | Production (Neon) |
|---------|---|---|
| **Speed** | ⚡ Fastest (10-25ms) | 🌍 Slower (50-100ms) |
| **Setup** | 🔨 Zero config | ⚙️ Requires deployment |
| **Location** | 💻 Your machine | ☁️ Cloud server |
| **Purpose** | 🛠️ Development | 🚀 Deployment |
| **Cost** | 💰 Free | 💰 Neon free tier, Vercel free tier |
| **Offline** | ✅ Works offline | ❌ Requires internet |

## Key Files

- `.env.development` - Local SQLite configuration
- `.env.production` - Neon production configuration
- `.github/workflows/deploy.yml` - GitHub Actions deployment script
- `src/services/api.js` - Frontend API client (reads VITE_API_BASE_URL)
- `api/server.js` - Express.js backend server
- `vite.config.js` - Vite build configuration

## Security Notes

⚠️ **IMPORTANT**:
- **Never** commit `.env` files with actual credentials
- Both `.env.development` and `.env.production` should be in `.gitignore` if they contain secrets
- Public URLs (like the Vercel endpoint) are safe in `.env.production`
- Keep Neon DATABASE_URL private in Vercel environment variables
- Use GitHub Actions secrets for sensitive information

## Next Steps

✅ Verify both environments are working:
```bash
# Test local (should work immediately)
npm run dev

# Test production build
npm run build && npm run preview
```

Have both environments working for complete flexibility! 🎉
