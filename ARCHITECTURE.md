# Architecture

## Big picture

SprintDesk separates state into three clearly owned layers:

| Layer                | Owner                        | Examples                                   |
| -------------------- | ---------------------------- | ------------------------------------------ |
| Server-ish data      | TanStack Query cache         | tasks, sprints, users, notifications        |
| Ephemeral UI state   | Zustand stores               | theme, toasts, drawer/modal, filters        |
| Session/auth tokens  | Zustand persist + memory     | refresh token (persisted), access token (RAM)|

### Why task data lives in the Query cache — not in a Zustand store

The board is the app's source of truth. Duplicating it into a second global
store invites drift and double invalidation logic. Instead:

- `services/task.repository.ts` is a **persistence layer** ("local database").
  It hydrates once from `localStorage` (`sprintdesk.tasks.v1`), falling back to
  the bundled `src/data/mock-data.json` seed, and commits every mutation back.
- `hooks/useTasks.ts` exposes it through TanStack Query
  (`queryKey: ['tasks']`). All reads flow through the cache; all writes go
  through repository mutations that invalidate `['tasks']`.
- Zustand stores never hold task lists. `board.store` holds only *view* state:
  search text, assignee/priority filters, selected task id, drawer/modal flags.

This gives optimistic updates with rollback for free via `onMutate` /
`onError` on the move mutation.

## Auth lifecycle

```
LoginPage ──login()──▶ auth.service ──POST /auth/login──▶ DummyJSON
                          │
                          ├─ access token  → memory only (apiClient module)
                          ├─ refresh token → zustand persist ('sprintdesk.auth')
                          └─ user          → auth store

apiRequest(url)
  ├─ proactive: if no token OR simulated TTL elapsed → runRefresh()
  ├─ attach Authorization: Bearer <token>
  ├─ on 401 → runRefresh() once → retry the original request
  └─ refresh failure → clearAccessToken(), ApiError propagates
```

Key properties:

- **Access token is memory-only** — a stolen localStorage dump cannot replay
  the short-lived credential; the persisted refresh token is what restores a
  session on reload (`initializeSession()` runs once at provider mount).
- **Simulated TTL** — DummyJSON returns long-lived tokens, so the service
  stamps them with an internal expiry of ~10 minutes (minus clock-skew
  margin). `isAccessTokenExpired()` compares against that timestamp, which
  exercises the real silent-refresh path during a review session.
- **Single-flight refresh** — concurrent 401s share one `inflightRefresh`
  promise so N parallel requests trigger at most one refresh call.
- **Decoupled client** — `apiClient` has zero React/Zustand imports. The auth
  store registers its refresh implementation via `setRefreshHandler()` at
  startup, keeping the HTTP layer unit-testable.

## Routing & guards

```
/            → redirect /dashboard
/login       → public-only (redirects authenticated users to /dashboard)
/dashboard   ┐
/board       ├─ ProtectedRoute wrapper + lazy-loaded pages inside AppLayout
/analytics   ┘
*            → redirect /dashboard
```

`ProtectedRoute` checks the auth store synchronously; there is no async gate,
because the persisted refresh token means "session exists" even while the
access token is being silently renewed.

## Kanban board internals

- Columns are computed from the flat task list (`status` grouping, sorted by
  `order`) — never stored separately.
- dnd-kit setup: `PointerSensor` with a 6 px activation distance (so clicks
  still open cards), `KeyboardSensor` with `sortableKeyboardCoordinates`,
  `closestCorners` collision strategy, droppable ids `column:<status>`.
- During a drag the board renders a **local preview** of affected columns;
  the preview commits through the `useMoveTask` mutation or resets on
  cancel/error. The repository recalculates gapless per-column orders, and
  `completedAt` is stamped/cleared automatically when a card enters/leaves
  Done (which also drives analytics).

## Notifications

A single interval (30 s) fetches JSONPlaceholder posts, transforms them into
app notifications, and merges unseen items into the persisted notifications
store. The timer is torn down when logged out and paused via the Page
Visibility API while the tab is hidden.

## Styling

Tailwind v4 (CSS-first config in `src/index.css`, `@theme` tokens). Dark mode
is class-driven (`dark:` variants) toggled by `ui.store.theme`; the choice is
persisted and applied by a `class` mutation on `<html>`.

## Testing strategy

Vitest + jsdom + Testing Library (`src/test/setup.ts`):

| File                     | Covers                                                        |
| ------------------------ | ------------------------------------------------------------- |
| `useToast.test.tsx`      | toast add/types/dismiss/auto-dismiss timers                   |
| `taskService.test.ts`    | seed integrity, add/move/reorder/delete, persistence, completedAt semantics |
| `apiClient.test.ts`      | bearer attach, proactive refresh, 401 retry-once, refresh-failure paths |

Analytics selectors are pure functions over the task list and are exercised
through the same data path the charts use.
