# MongoDB Setup — Dedicated User for CampusVerse

## Step 1 — Atlas → Database Access → Add New Database User

Log in to [MongoDB Atlas](https://cloud.mongodb.com), then:

1. Sidebar → **Database Access** → **+ Add New Database User**
2. Fill in the form exactly as shown:

| Field | Value |
|---|---|
| Authentication Method | Password |
| Username | `campusverse_user` |
| Password | `CampusVerse2026` |
| Role | **Atlas Admin** or **readWriteAnyDatabase** |

3. Click **Add User**

---

## Step 2 — Whitelist your server IP

1. Sidebar → **Network Access** → **+ Add IP Address**
2. Add your backend server's public IP (Render, Railway, VPS — wherever Node.js runs)
3. For development/testing only, you can temporarily allow `0.0.0.0/0` — remove it before go-live

---

## Step 3 — Get your connection string

1. Sidebar → **Database** → **Connect** → **Connect your application**
2. Driver: **Node.js**, Version: **5.x or later**
3. Your connection string (ready to use — password already filled in):

```
mongodb+srv://campusverse_user:CampusVerse2026@learnhub.07ozegd.mongodb.net/campusverse_db?retryWrites=true&w=majority&appName=learnhub
```

> Replace `cluster0.xxxxx` with your actual Atlas cluster hostname shown in the Connect dialog.

This is your `MONGODB_URI`.

---

## Step 4 — Add environment variables to Render (backend)

Settings → Environment → add each variable:

```
NODE_ENV         = production
PORT             = 5000
MONGODB_URI      = mongodb+srv://campusverse_user:CampusVerse2026@learnhub.07ozegd.mongodb.net/campusverse_db?retryWrites=true&w=majority&appName=learnhub
MONGODB_DB_NAME  = campusverse_db
JWT_SECRET       = <generate with: openssl rand -hex 64>
JWT_EXPIRES_IN   = 7d
ALLOWED_ORIGINS  = https://campusverse.store,https://www.campusverse.store
RATE_LIMIT_WINDOW_MS = 900000
RATE_LIMIT_MAX   = 100
```

---

## Step 5 — Add environment variables to Vercel (frontend)

Settings → Environment Variables → Production:

```
VITE_API_URL = https://api.campusverse.store/api
```

---

## Step 6 — Rotate the password if compromised

1. Atlas → **Database Access** → Edit `campusverse_user` → **Edit Password**
2. Update `MONGODB_URI` in Render's environment variables
3. Redeploy the backend — the app reconnects automatically with the new password
