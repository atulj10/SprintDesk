# SprintDesk

A lightweight sprint-management SPA built as a frontend assessment: authenticate, plan work on a drag-and-drop Kanban board, and inspect live analytics.

## Features

- **Authentication** — login against DummyJSON with simulated 10-minute access-token expiry, silent refresh, protected routes and route guards.
- **Dashboard** — KPI tiles (total / in-progress / completed tasks), current-sprint progress with days remaining, recent activity.
- **Kanban board** — four columns (Backlog → In Progress → Review → Done) with full keyboard- and pointer-accessible drag & drop (dnd-kit). Cards open an edit drawer; create via modal; optimistic moves with rollback on failure. Board state survives page reloads (localStorage persistence).
- **Task detail drawer** — view/edit all task fields, comments per task (add/delete), delete confirmation flow.
- **Analytics** — four live charts derived from current board state via pure selectors: velocity by sprint, status distribution, priority breakdown, 7-day completion trend (Recharts).
- **Notifications** — bell dropdown polling JSONPlaceholder every 30 s (paused when the tab is hidden or logged out), unread badge, mark-as-read.
- **UX polish** — toast system, skeleton loaders, empty states with retry, full light/dark theming, responsive from mobile to desktop.

## Tech stack

| Concern            | Choice                                   |
| ------------------ | ---------------------------------------- |
| Build / dev server | Vite 8 + React 19 + TypeScript 6 (strict)|
| Styling            | Tailwind CSS v4                          |
| Routing            | React Router 6                           |
| Server cache       | TanStack Query 5                         |
| Client state       | Zustand 5 (persist middleware)           |
| Drag & drop        | dnd-kit                                  |
| Charts             | Recharts                                 |
| Icons              | lucide-react                             |
| Tests              | Vitest + Testing Library                 |

## Getting started

```bash
npm install
cp .env.example .env   # optional - defaults match the example
npm run dev
```

The app opens at `http://localhost:5173`. Log in with a valid DummyJSON account.

Demo credentials are **not committed** to this repository. For local testing,
DummyJSON publishes public demo accounts in its [official auth docs](https://dummyjson.com/docs/auth);
keep your copy in `.env` (gitignored) rather than in any tracked file.

### Scripts

| Command           | Purpose                              |
| ----------------- | ------------------------------------ |
| `npm run dev`     | Start Vite dev server                |
| `npm run build`   | Typecheck (`tsc -b`) + production build |
| `npm run preview` | Serve the production build           |
| `npm run lint`    | ESLint                               |
| `npm run test`    | Run unit tests once                  |
| `npm run test:watch` | Vitest watch mode                 |

### Environment variables

See [.env.example](./.env.example):

- `VITE_DUMMYJSON_BASE_URL` — auth API base (default `https://dummyjson.com`)
- `VITE_JSONPLACEHOLDER_BASE_URL` — notification polling API base (default `https://jsonplaceholder.typicode.com`)

## API list (Swagger UI)

The external endpoints the app consumes are documented in an OpenAPI 3 spec, browsable through Swagger UI:

1. Start the dev server:
   ```bash
   npm run dev
   ```
2. Open **<http://localhost:5173/swagger.html>** to browse the full endpoint list interactively (try requests, inspect schemas).

The raw spec is served at <http://localhost:5173/openapi.yaml> and lives in [public/openapi.yaml](./public/openapi.yaml) — edit that file and refresh the page to see your changes.

## Project structure

```
src/
├── api-mocks/          # Simulated latency/failure helpers for the data layer
├── components/         # ui/ primitives, layout/, board/, tasks/, analytics/
├── data/
│   └── mock-data.json  # Seed dataset: users, sprints, tasks, comments
├── hooks/              # useTasks/useSprints/useUsers (Query), useToast, ...
├── lib/                # storage wrapper, date helpers, cn()
├── pages/              # LoginPage, DashboardPage, BoardPage, AnalyticsPage
├── selectors/          # Pure analytics calculations over the task list
├── services/           # auth.service, task.repository (persistence layer)
│   └── api/apiClient   # fetch wrapper: bearer attach, silent refresh, 401 retry
├── stores/             # Zustand: auth, ui (theme/toasts/drawer), notifications
└── types/              # Shared domain types
```

## Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) — state management decisions, data flow, auth lifecycle.
- [API.md](./API.md) — external endpoints used plus the internal service/repository surface.
- [public/openapi.yaml](./public/openapi.yaml) — OpenAPI 3 spec (see [API list (Swagger UI)](#api-list-swagger-ui)).
