# CampusVerse — Secure Student Economy Ecosystem

CampusVerse is a world-class, secure digital marketplace, social network, and student-to-student service economy. This repository is configured initially for the University of Nigeria, Nsukka (UNN) and Nsukka community.

---

## 🛠️ Project Architecture

The project is structured as an NPM monorepo with workspaces:
*   **`frontend/`**: Single Page Application built on React + Vite. Styled with vanilla CSS variables for a premium, dark glassmorphic interface with reactive UI widgets.
*   **`backend/`**: Node.js & Express server backed by Prisma + SQLite. Handles:
    *   Real accounts (bcrypt password hashing, JWT sessions) and a persistent wallet with race-safe balance transfers.
    *   A real peer-to-peer marketplace (create/list listings) with an escrow lifecycle that actually locks and releases wallet funds.
    *   Dynamic trust score engine, computed from real, persisted verification flags.
    *   KYC validations (NIN, BVN, Selfie biometric match) — still simulated (no live NIMC/bank/biometric integration), but now persisted per user instead of living only in frontend state.
    *   Anti-fraud telemetry, request risk ratings, and the IMEI stolen-device blacklist.
    *   Services and the local business directory are still static demo data (not yet ported).

This is a merge-in-progress from [CampusHub](https://github.com/mabrig1/CampusHub), a sibling campus-marketplace app — CampusHub's real-database/real-auth/atomic-wallet engineering is being layered onto CampusVerse's own peer-to-peer + escrow + trust-score design, incrementally. **Phase 1 (this pass): auth, wallet, and the marketplace/escrow engine are now real.** Food delivery, printing, accommodation, jobs, transportation, and events are CampusHub modules not yet ported — planned for follow-up passes.

---

## 🚀 Getting Started

Ensure you have **Node.js** (v18+) installed.

### 1. Installation
All dependencies can be installed from the root workspace using:
```bash
npm run install:all
```

### 2. Set up the backend database

```bash
cd backend
cp .env.example .env
# Generate a real secret and put it in .env's JWT_SECRET:
openssl rand -base64 32
npx prisma migrate dev --name init
node prisma/seed.js   # optional demo data — wipes existing rows first
cd ..
```

`DATABASE_URL` defaults to a local SQLite file (`backend/dev.db`), the same tradeoff CampusHub documents: fine for one persistent-disk process, not for serverless or multiple instances. Swap `provider = "sqlite"` for `"postgresql"` in `backend/prisma/schema.prisma` and point `DATABASE_URL` at a real Postgres instance before deploying behind more than one backend instance.

### 3. Run the Services

Open two terminal sessions or run the services in the background:

*   **Start Backend Engine (Port 5000)**:
    ```bash
    npm run dev:backend
    ```
*   **Start Frontend Interface**:
    ```bash
    npm run dev:frontend
    ```

Once running, navigate to the local frontend address (typically `http://localhost:5173`) in your browser. Log in with any seeded demo account (`chinedu@unn.edu.ng`, `amara@unn.edu.ng`, `emeka@unn.edu.ng`, or `blessing@unn.edu.ng`), password `password123` — or register a new account.

---

## 🛡️ Interactive Scenarios to Test

### 1. Test the Escrow payment engine (moves real wallet balance)
1. Log in as a buyer, go to the **Wallet** tab to see your starting balance.
2. Go to the **Marketplace** tab. Under any listing that isn't your own, click **Buy Escrow** (funds are locked from your real wallet balance immediately — insufficient funds are rejected).
3. You'll be redirected to the **Escrow Engine** panel.
4. Click **Run Hub Inspection Report & Score** to trigger the diagnostic check.
5. Click **Accept & Release Funds to Seller** to actually credit the seller's wallet, or **Raise Dispute** to lock the funds in arbitration.
6. Check the **Wallet** tab again (as buyer and as seller, via a second login) to see the real transaction history.

### 2. List an item for sale
1. Go to the **Marketplace** tab and click **Sell an Item**.
2. Fill in the listing form — it's created for real and immediately visible to other students.

### 3. Live Device Integrity Check
1. Go to the **Marketplace** tab.
2. In the anti-theft scanner search bar:
    *   Type `357289110482937` and click **Verify**. (Flagged stolen device)
    *   Type any other number (e.g., `850123985102948`) and click **Verify**. (Clean device)

### 4. Biometric & Identity Trust Scoring
1. Go to the **Trust & KYC** tab.
2. Enter a mock 11-digit number in the **NIN** or **BVN** forms and submit.
3. Click **Verify Selfie** to trigger the face matching comparison algorithm.
4. Observe how your **Trust Score** dial dynamically increases as you complete each step (now persisted server-side), leveling up your profile tier from "Unverified" to "Trusted Trader".
