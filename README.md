# CampusVerse — Secure Student Economy Ecosystem

CampusVerse is a world-class, secure digital marketplace, social network, and student-to-student service economy. This repository is configured initially for the University of Nigeria, Nsukka (UNN) and Nsukka community.

---

## 🛠️ Project Architecture

The project is structured as an NPM monorepo with workspaces:
*   **`frontend/`**: Single Page Application built on React + Vite. Styled with vanilla CSS variables for a premium, dark glassmorphic interface with reactive UI widgets.
*   **`backend/`**: Node.js & Express server simulating NestJS endpoints. Handles:
    *   Dynamic trust score engine algorithms.
    *   KYC validations (NIN, BVN, Selfie biometric match).
    *   Anti-fraud telemetry and request risk ratings.
    *   IMEI stolen database blacklists.
    *   Interactive escrow payment lifecycle.

---

## 🚀 Getting Started

Ensure you have **Node.js** (v16+) installed.

### 1. Installation
All dependencies can be installed from the root workspace using:
```bash
npm run install:all
```

### 2. Run the Services

Open two terminal sessions or run the services in the background:

*   **Start Backend Engine (Port 5000)**:
    ```bash
    npm run dev:backend
    ```
*   **Start Frontend Interface**:
    ```bash
    npm run dev:frontend
    ```

Once running, navigate to the local frontend address (typically `http://localhost:5173`) in your browser.

---

## 🛡️ Interactive Scenarios to Test

### 1. Test the Escrow payment Engine
1. Go to the **Marketplace** tab.
2. Under any product with a "🛡️ Inspected & Verified" badge, click **Buy Escrow**.
3. You will be automatically redirected to the **Escrow Engine** panel.
4. Click **Simulate Hub Inspection Report & Score** to trigger the diagnostic check.
5. Click **Accept & Release Funds to Seller** to finalize the ledger disbursement, or click **Raise Dispute** to simulate locking funds in arbitration.

### 2. Live Device Integrity Check
1. Go to the **Marketplace** tab.
2. In the anti-theft scanner search bar:
    *   Type `357289110482937` and click **Verify**. (Flagged stolen device)
    *   Type any other number (e.g., `850123985102948`) and click **Verify**. (Clean device)

### 3. Biometric & Identity Trust Scoring
1. Go to the **Trust & KYC** tab.
2. Enter a mock 11-digit number in the **NIN** or **BVN** forms and submit.
3. Click **Verify Selfie** to trigger the face matching comparison algorithm.
4. Observe how your **Trust Score** dial dynamically increases as you complete each step, leveling up your profile tier from "Unverified" to "Trusted Trader".
