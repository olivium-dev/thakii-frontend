# main vs feature/Finalize-payment-flow — Comparison & Blank Page Cause

## Summary

| Item | main | feature/Finalize-payment-flow |
|------|------|------------------------------|
| **App imports** | `AuthContext`, `api`, `websocket` directly | `authAdapter`, `apiAdapter`, `websocketAdapter` |
| **Top-level await** | No | Yes (in all 3 adapters) |
| **Vite build target** | Default (esnext) | `es2022` (required for top-level await) |
| **Deploy trigger** | Yes (push to main) | No (only `main` and `feature/websocket-updates` trigger deploy) |

---

## Changes on feature branch (3 commits ahead of main)

1. **ee08e68** – feat: add credits system (balance, packages modal, purchase flow)
2. **d6aa55a** – feat: payment flow (checkout, redirect to payment-web, balance API)
3. **1faca78** – fix(build): set target to es2022 for top-level await in adapters

---

## Root cause of blank page

1. **Adapters use top-level `await`**
   - `src/contexts/authAdapter.jsx`: `const authModule = isMockMode() ? await import(...) : await import(...);`
   - `src/services/apiAdapter.js`: same pattern
   - `src/services/websocketAdapter.js`: same pattern  
   If the build is **not** done with `target: 'es2022'`, the emitted code can break in some browsers or at bootstrap → **blank page**.

2. **Deploy workflow does not run for this branch**
   - `deploy.yml` runs on: `push` to `main` or `feature/websocket-updates`.
   - **feature/Finalize-payment-flow** is not in the trigger, so:
     - Either the live site was built from **main** (no adapters), or
     - Someone ran **workflow_dispatch** and chose the feature branch. If that build was from before commit **1faca78** (es2022), the deployed app would have top-level await but without the right target → blank page.

3. **Fix**
   - Ensure every deploy of the feature branch uses a build that includes **`target: 'es2022'`** (i.e. includes commit 1faca78).
   - Prefer **merging feature/Finalize-payment-flow into main** and deploying from main, so the server always gets a single, consistent build with es2022.
   - Or add **feature/Finalize-payment-flow** to the deploy trigger so pushes to that branch also produce a correct build and deploy.

---

## Files changed (feature vs main)

- **Critical for boot:** `src/contexts/authAdapter.jsx` (new), `src/services/apiAdapter.js` (new), `src/services/websocketAdapter.js` (new), `vite.config.js` (+ `target: 'es2022'`).
- **App entry:** `src/App.jsx` – now imports from adapters and adds credits/payment UI.
- **Other:** Header, CreditPackagesModal, mocks, e2e, etc.
