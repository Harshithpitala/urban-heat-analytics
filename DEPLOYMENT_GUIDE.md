# Cloud Deployment Guide
> **Urban Heat & Human Activity Analytics — Production Deployment**

This guide provides step-by-step instructions to deploy your full-stack MERN application to the cloud for free with **zero CORS headaches**, using your live **MongoDB Atlas** database.

---

## 🎯 Recommended Deployment Architecture: Render.com (All-in-One)

With the Phase 10 production build configuration, **both the React frontend and Node.js backend run together on a single Render Web Service**:
- **Single URL**: e.g., `https://urban-heat-analytics.onrender.com`
- **Zero CORS Issues**: Frontend and API share the exact same domain.
- **Cost**: **100% Free** (Render Free Tier + MongoDB Atlas Free Shared Cluster).
- **Setup Time**: ~5 minutes.

---

## Step 1: Push Code to GitHub

Open a terminal in `C:\Users\HARSHITH\Data_Analytics` and run:

```bash
# 1. Initialize Git (if not already done)
git init

# 2. Stage all project files (.gitignore protects your passwords and .env)
git add .

# 3. Create your initial commit
git commit -m "feat: complete Phase 10 production-ready release"

# 4. Rename main branch
git branch -M main

# 5. Link your GitHub repository (replace with your repository URL)
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/<YOUR_REPO_NAME>.git

# 6. Push to GitHub
git push -u origin main
```

> [!IMPORTANT]
> Your `.gitignore` is already pre-configured to **exclude** `server/.env` and `node_modules`. Your MongoDB credentials will **not** be exposed on GitHub.

---

## Step 2: Deploy on Render.com

1. Go to [**Render.com**](https://render.com/) and Sign In (or Sign Up using your GitHub account).
2. On your Dashboard, click **New +** $\rightarrow$ **Web Service**.
3. Choose **"Build and deploy from a Git repository"** and click **Next**.
4. Select your **`urban-heat-analytics`** repository.
5. Configure the service settings:
   * **Name**: `urban-heat-analytics` (or any name you prefer)
   * **Region**: Choose the closest region (e.g. *Singapore*, *Oregon*, or *Frankfurt*)
   * **Branch**: `main`
   * **Root Directory**: *(Leave empty)*
   * **Runtime**: **Node**
   * **Build Command**:
     ```bash
     npm run build
     ```
   * **Start Command**:
     ```bash
     npm start
     ```
   * **Instance Type**: **Free**

---

## Step 3: Add Environment Variables in Render

Scroll down to the **Environment Variables** section on the same page and add these 2 variables:

| Key | Value | Notes |
| :--- | :--- | :--- |
| **`NODE_ENV`** | `production` | Enables static asset serving & optimized express mode |
| **`MONGODB_URI`** | `mongodb+srv://pharshith:9390216539Aa@cluster0.qppemkg.mongodb.net/urban_heat_analytics?appName=Cluster0` | Your MongoDB Atlas connection string |

*(Optional)* If you want to customize the port, you can set `PORT` to `10000` (Render sets this automatically).

---

## Step 4: Click "Create Web Service"

1. Click **Create Web Service** at the bottom of the page.
2. Render will automatically:
   - Clone your GitHub repository
   - Run `npm run build` (installs server & client dependencies and compiles Vite production bundle)
   - Start the server using `npm start`
   - Connect to your **MongoDB Atlas** database
3. When the build finishes, you will see a green **"Live"** badge!
4. Click your live URL (e.g. `https://urban-heat-analytics.onrender.com`).

---

## Step 5: Verify Your Live Deployment

Open your browser and test:
1. **Main UI**: `https://your-app-name.onrender.com/`
   - Check Dashboard KPIs, interactive Map, HERI Risk Index, and Insights.
2. **API Health Check**: `https://your-app-name.onrender.com/api/health`
   - Should return: `{"success":true,"message":"Urban Heat Analytics API is running","database":"connected"}`
3. **Executive Command Center**: `https://your-app-name.onrender.com/dashboard`

---

## Alternative: Vercel (Frontend) + Render (Backend)

If you prefer deploying the frontend separately on **Vercel**:

### 1. Backend (Render):
- Deploy as a Web Service on Render with Root Directory set to `server`.
- Build Command: `npm install`
- Start Command: `node src/server.js`
- Copy your Render backend URL (e.g. `https://urban-heat-api.onrender.com`).

### 2. Frontend (Vercel):
- Go to [Vercel.com](https://vercel.com/) $\rightarrow$ Add New Project $\rightarrow$ Import Repo.
- Set **Root Directory** to `client`.
- Add Environment Variable:
  - `VITE_API_URL` = `https://urban-heat-api.onrender.com/api`
- Click **Deploy**.
