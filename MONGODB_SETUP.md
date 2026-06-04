# MongoDB Setup — Dedicated User for CampusVerse

## Step 1 — Create the Database & Dedicated User in MongoDB Atlas

Log in to [MongoDB Atlas](https://cloud.mongodb.com) then follow these steps:

### 1a. Create the database user

1. Sidebar → **Database Access** → **+ Add New Database User**
2. Fill in the form:

   | Field | Value |
   |---|---|
   | Authentication Method | Password |
   | Username | `campusverse_user` |
   | Password | Generate a strong password (save it — you will need it once) |
   | Built-in Role | **Read and write to any specific database** |
   | Specific database | `campusverse_db` |

3. Click **Add User**.

> The user `campusverse_user` can **only** read/write `campusverse_db`.  
> It cannot drop the cluster, access other databases, or modify Atlas settings.

---

### 1b. Whitelist your server IP

1. Sidebar → **Network Access** → **+ Add IP Address**
2. Add your backend server's public IP (Render, Railway, VPS — wherever the Node.js app runs).
3. For development only, you can temporarily allow `0.0.0.0/0`, but remove it before go-live.

---

### 1c. Get your connection string

1. Sidebar → **Database** → **Connect** → **Connect your application**
2. Driver: **Node.js**, Version: **5.x or later**
3. Copy the string. It looks like:

```
mongodb+srv://campusverse_user:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

4. Replace `<password>` with the password you set in Step 1a.
5. Append the database name before the `?`:

```
mongodb+srv://campusverse_user:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/campusverse_db?retryWrites=true&w=majority
```

This is your `MONGODB_URI`.

---

## Step 2 — Add the URI to your deployment platform

### Render
Settings → Environment → Add the following variables:

```
MONGODB_URI      = <your connection string>
MONGODB_DB_NAME  = campusverse_db
NODE_ENV         = production
PORT             = 5000
JWT_SECRET       = <generate: openssl rand -hex 64>
ALLOWED_ORIGINS  = https://campusverse.store,https://www.campusverse.store
```

### Vercel (frontend only — no backend runs here)
Settings → Environment Variables → Build & Production:

```
VITE_API_URL = https://api.campusverse.store/api
```

---

## Step 3 — Rotate the password if compromised

1. Atlas → Database Access → Edit `campusverse_user` → Edit Password
2. Update `MONGODB_URI` in your hosting platform's env vars
3. Redeploy the backend service — the app reconnects automatically
