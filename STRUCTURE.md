# Project Structure

This document describes the intended layout and conventions for the Thakii Lecture2PDF frontend.

## Directory layout

```
thakii-frontend/
├── index.html              # Entry HTML
├── vite.config.js          # Vite config
├── tailwind.config.js      # Tailwind CSS
├── postcss.config.js
├── package.json
├── src/
│   ├── main.jsx            # App entry: mounts React root
│   ├── App.jsx             # Root component and layout
│   ├── index.css            # Global styles (Tailwind + custom)
│   │
│   ├── config/             # App configuration (env, third-party init)
│   │   └── firebase.js     # Firebase init (auth only)
│   │
│   ├── contexts/           # React context providers
│   │   └── AuthContext.jsx # Auth (Firebase)
│   │
│   ├── services/           # API and real-time services
│   │   ├── api.js          # Backend API client
│   │   └── websocket.js    # Socket.IO client
│   │
│   ├── mocks/              # Mock implementations (e2e / dev with VITE_MOCK_MODE=true)
│   │   ├── mockConfig.js   # isMockMode(), delays, etc.
│   │   ├── MockAuthProvider.jsx
│   │   ├── mockApiService.js
│   │   ├── mockWebSocketService.js
│   │   └── data/           # JSON fixtures
│   │
│   └── components/        # React UI components
│       ├── ErrorBoundary.jsx
│       ├── Header.jsx
│       ├── FileUpload.jsx
│       ├── VideoList.jsx
│       ├── CreditPackagesModal.jsx
│       ├── Auth/           # Auth-related components
│       │   ├── FirebaseLogin.jsx
│       │   └── BackendAuth.jsx
│       └── ...             # Other feature components
│
├── e2e/                    # Playwright E2E tests
│   └── credits.spec.js
├── scripts/                # Devops / deployment helpers
│   ├── check-server.sh
│   └── run-server-check.sh
└── .github/workflows/      # CI/CD
    └── deploy.yml
```

## Conventions

### Naming

- **Components**: PascalCase (e.g. `Header.jsx`, `CreditPackagesModal.jsx`).
- **Non-component modules**: camelCase (e.g. `mockConfig.js`).
- **Contexts**: PascalCase (e.g. `AuthContext.jsx`).

### Imports

- **Auth**: Import `AuthProvider` / `useAuth` from `contexts/AuthContext`.
- **API / WebSocket**: Import `apiService` from `services/api`, `websocketService` from `services/websocket`.
- **Paths**: Use relative imports from `src/` (e.g. `from './contexts/AuthContext'`, `from './services/api'`).

### What belongs where

| Kind | Location | Example |
|------|----------|---------|
| React components | `src/components/` | Header, FileUpload, VideoList |
| Auth / global state | `src/contexts/` | AuthContext |
| API / WebSocket clients | `src/services/` | api.js, websocket.js |
| App config (env, SDKs) | `src/config/` | firebase.js |
| Mock implementations | `src/mocks/` | MockAuthProvider, mockApiService, data/*.json |
| Global styles | `src/index.css` | Tailwind + app-wide CSS |
| E2E tests | `e2e/` | credits.spec.js |
| Deployment / ops | `scripts/`, `.github/` | check-server.sh, deploy.yml |

### What not to commit under `src/`

- Duplicate or backup copies of `App.jsx` or other entry modules.
- One-off test components (e.g. `SimpleTest.jsx`) unless they live under a test or demo path.
- Unused CSS files (e.g. default Vite `App.css` if the app uses only `index.css`).
- Multiple copies of the same component (e.g. only one `ErrorBoundary` in `components/`).

## Mocks

The `src/mocks/` folder contains mock auth, API, and WebSocket implementations and fixtures. These are not wired into the app (no adapter layer). They remain for reference or for future E2E/mock-mode support.
