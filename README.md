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
    *   A configurable **campus marketplace module**: real category/campus-location config (not hardcoded to any one institution), search/filtering, infinite scroll, favorites, listing reports, and simulated paid promotion (Pin/Highlight/Feature).
    *   Services and the local business directory are still static demo data (not yet ported).

This is a merge-in-progress from [CampusHub](https://github.com/mabrig1/CampusHub), a sibling campus-marketplace app — CampusHub's real-database/real-auth/atomic-wallet engineering is being layered onto CampusVerse's own peer-to-peer + escrow + trust-score design, incrementally. **Phase 1: auth, wallet, and the marketplace/escrow engine are real. Phase 2 (this pass): a richer, configurable marketplace browsing/search/promotion module.** Food delivery, printing, accommodation, jobs, transportation, events, Student Services listings, the Campus Ad Board, and admin moderation are not yet built — planned for follow-up passes.

### Campus Marketplace module (Phase 2)

Everything under `frontend/src/marketplace/` and the marketplace-related routes in `backend/server.js`:

*   **Configurable, institution-agnostic**: campus locations and product categories live in `backend/src/campus-config.js` (single source of truth, served over `/api/campus-locations` and `/api/marketplace-categories`) — no campus name, hostel name, or institution is hardcoded into the module's logic. Swap that file's arrays to reconfigure for any university.
*   **Search & filters**: keyword, category, campus location, condition (New/Used), price range, verified-sellers-only, featured-only, my-favorites, sort by newest/most popular — all real-time against the backend, with infinite scroll (`IntersectionObserver`) and skeleton loaders while data loads.
*   **Listings**: multi-image galleries, a strict New/Used badge plus a free-text condition note, WhatsApp click-to-chat (auto-filled message) and Call Seller as a direct-contact path alongside the existing escrow purchase flow, save/favorite, share, and report-listing.
*   **Promotion (Pin/Highlight/Feature)**: a listing owner can promote their own listing; cost is `days × price-per-day` (`backend/src/campus-config.js`'s `PROMOTION_PRICING`) and is charged from their real wallet — **no live Paystack/Flutterwave/Monnify integration**, this simulates the payment and records it (`Promotion` model) in the shape a real gateway integration would need later. Promoted listings rank above regular ones across the whole result set, not just within one page.
*   Built with React Hook Form + Zod (the listing form), Framer Motion (card/menu transitions), and `lucide-react` icons, per the module's own request — the rest of the app's hand-rolled inline-SVG icons and plain-`useState` forms were left as-is rather than rewritten wholesale.
*   Scoped to a `.cv-market` CSS class (`frontend/src/marketplace/theme.css`) so its Deep Emerald Green / Warm Gold palette doesn't change the rest of the app's existing purple/blue theme.
*   **Not built in this pass** (see the Rollout scope note above): the Student Services side of this request (service categories, booking modal, provider ratings), the Campus Ad Board carousel, and admin moderation pages (approve/reject listings, verify students, manage reports) — the `Report` model already exists and is being written to, so an admin queue is a straightforward follow-up against existing data.

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

### 2. List an item for sale, with promotion
1. Go to the **Marketplace** tab and click the floating **+** button, then **Sell a Product**.
2. Fill in the listing form (category and campus location come from configuration, not a hardcoded list) and optionally choose a promotion tier — the cost is calculated live and charged from your real wallet on publish.
3. Your new listing appears immediately, and — if promoted — ranks above non-promoted listings.

### 3. Search, filter, and favorite
1. Use the search bar or filter chips (Featured, Under ₦5,000, Verified Sellers, Newest, Most Popular, category chips, or **Filters** for location/condition/price range).
2. Click the heart icon on any listing to save it, then click **My Favorites** to see only your saved listings.
3. Open a listing to see its full gallery, seller profile, related listings, and to Share, Report, or contact the seller via WhatsApp/Call.

### 4. Live Device Integrity Check
1. Go to the **Marketplace** tab.
2. In the anti-theft scanner search bar:
    *   Type `357289110482937` and click **Verify**. (Flagged stolen device)
    *   Type any other number (e.g., `850123985102948`) and click **Verify**. (Clean device)

### 5. Biometric & Identity Trust Scoring
1. Go to the **Trust & KYC** tab.
2. Enter a mock 11-digit number in the **NIN** or **BVN** forms and submit.
3. Click **Verify Selfie** to trigger the face matching comparison algorithm.
4. Observe how your **Trust Score** dial dynamically increases as you complete each step (now persisted server-side), leveling up your profile tier from "Unverified" to "Trusted Trader".
