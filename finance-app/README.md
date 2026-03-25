# 💰 Teacher Finance Tracker

Your personal finance app — accessible from any device, anywhere.

---

## 🚀 Deploy in 3 Steps (all free!)

### Step 1: Set up Firebase (free — for syncing data across devices)

1. Go to **https://console.firebase.google.com**
2. Click **"Create a project"** → Name it anything (e.g. `my-finance-tracker`) → Continue
3. Disable Google Analytics (you don't need it) → Create Project
4. On the project dashboard, click the **Web icon** (`</>`) to add a web app
5. Name it anything → Click **Register app**
6. You'll see a `firebaseConfig` object — **copy those values**
7. Open `src/firebase.js` in this project and paste your values into the config section
8. Back in Firebase console: click **Build → Firestore Database** in the sidebar
9. Click **Create Database** → Select **"Start in test mode"** → Choose your region → Done
10. Click **Build → Authentication** in the sidebar
11. Click **Get started** → Enable **"Anonymous"** sign-in → Save

✅ Firebase is ready!

### Step 2: Push to GitHub

1. Go to **https://github.com/new** and create a new repository (name it `finance-tracker`)
2. On your computer, open a terminal in this project folder and run:

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/finance-tracker.git
git branch -M main
git push -u origin main
```

If you don't have git installed, you can also drag & drop the folder contents
into GitHub's web upload interface on the repository page.

### Step 3: Deploy on Vercel (free)

1. Go to **https://vercel.com** → Sign up with your GitHub account
2. Click **"Add New" → "Project"**
3. Find your `finance-tracker` repo → Click **Import**
4. Vercel auto-detects Vite — just click **Deploy**
5. Wait ~60 seconds → You get a URL like `finance-tracker-abc123.vercel.app`

🎉 **Your app is live!** Open it on your phone, laptop, anywhere.

---

## 🤖 Enable the AI Advisor (optional)

The AI financial advisor needs an Anthropic API key to work.

1. Get an API key at **https://console.anthropic.com** (you'll need to add credits — starts at $5)
2. In Vercel: go to your project → **Settings → Environment Variables**
3. Add: `ANTHROPIC_API_KEY` = `sk-ant-api03-...` (your key)
4. Click **Redeploy** from the Deployments tab

The AI tab will now work. Without this step, everything else works perfectly — you just won't have the AI advisor.

---

## 💡 How It Works

| Feature | Technology | Cost |
|---------|-----------|------|
| Hosting | Vercel | Free |
| Data storage | Firebase Firestore | Free (up to 1GB) |
| Cross-device sync | Firebase Auth (anonymous) | Free |
| AI Advisor | Anthropic Claude API | ~$0.01/question |

Your data is stored per-device by default (anonymous auth). If you want the same data on phone AND laptop, you'd need to add email/Google login — happy to help with that later.

**Fallback:** If Firebase isn't configured, the app uses localStorage so it still works offline on a single device.

---

## 🛠 Local Development

```bash
npm install
npm run dev
```

Opens at http://localhost:3000

---

## 📁 Project Structure

```
finance-app/
├── api/
│   └── chat.js          ← Serverless function (AI proxy)
├── src/
│   ├── main.jsx         ← Entry point
│   ├── App.jsx          ← Your finance tracker
│   └── firebase.js      ← Database config (edit this!)
├── index.html
├── package.json
├── vite.config.js
└── vercel.json
```
