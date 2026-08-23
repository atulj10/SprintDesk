# API reference

> **Machine-readable spec:** [`public/openapi.yaml`](./public/openapi.yaml)
> (OpenAPI 3.0.3). View it in Swagger UI by running `npm run dev` and opening
> <http://localhost:5173/swagger.html>.

SprintDesk talks to two public demo APIs and exposes a small internal service
layer on top of them. No backend of its own.

## External APIs

### Authentication — DummyJSON (`VITE_DUMMYJSON_BASE_URL`, default `https://dummyjson.com`)

#### `POST /auth/login`

```jsonc
// Request (credentials come from the login form at runtime - never hardcode them)
{ "username": "<your-username>", "password": "<your-password>", "expiresInMins": 60 }

// Response (relevant fields)
{
  "accessToken": "...",
  "refreshToken": "...",
  "id": 9,
  "username": "<your-username>",
  "email": "user@example.com",
  "firstName": "Emily",
  "lastName": "Johnson",
  "image": "https://..."   // some payloads nest these under "userInfo"
}
```

- Called by `auth.service.login()` with `skipAuth` (no bearer/refresh logic).
- The response shape is normalized defensively: DummyJSON sometimes returns
  user fields flat, sometimes nested under `userInfo`.
- The returned tokens are treated as short-lived: the service stamps an
  internal ~10-minute expiry regardless of DummyJSON's real TTL so that the
  silent-refresh flow is exercised during review.

#### `POST /auth/refresh`

```jsonc
// Request
{ "refreshToken": "...", "expiresInMins": 60 }

// Response
{ "accessToken": "...", "refreshToken": "..." }
```

- Called by `auth.service.refresh()` through the registered refresh handler.
- On failure the apiClient clears the in-memory access token and surfaces an
  `ApiError`; protected queries then fail and route guards log out.

### Notifications — JSONPlaceholder (`VITE_JSONPLACEHOLDER_BASE_URL`, default `https://jsonplaceholder.typicode.com`)

#### `GET /posts?_limit=5`

Polled every 30 s while authenticated and the tab is visible
(`notification.service`). Posts are transformed into app notifications:

| Post field | Notification field             |
| ---------- | ------------------------------ |
| `id`       | id (dedupe key)                |
| `title`    | title                          |
| `body`     | message                        |
| `id % 3`   | type: info / success / warning |

## Internal service layer

### `services/api/apiClient.ts`

```ts
apiRequest<T>(url, init?, options?): Promise<T>  // throws ApiError on !ok
setAccessToken(token, expiresAtMs)               // memory-only credential
clearAccessToken()
getAccessToken(): string | null
isAccessTokenExpired(now?): boolean              // true when no token is set
setRefreshHandler(handler | null)                // registered by auth store
class ApiError extends Error { status: number }
```

Behaviour: proactive refresh before sending when the simulated TTL elapsed;
bearer attachment; single retry through refresh on 401; token cleared when
refreshing is impossible; concurrent refreshes collapse into one promise.

### `services/auth.service.ts`

```ts
login(username, password): Promise<AuthResult>   // { user, accessToken, refreshToken }
refresh(refreshToken): Promise<Tokens>           // rotates both tokens
ACCESS_TOKEN_TTL_MS                              // simulated expiry window
```

### `services/task.repository.ts` — local persistence ("database")

Hydrates from `localStorage['sprintdesk.tasks.v1']`, falling back to the
bundled seed; every mutation commits back.

```ts
taskRepository.getAll(): Task[]                  // deep copy
taskRepository.getById(id): Task | undefined
taskRepository.create(input: CreateTaskInput): Task        // appends to column
taskRepository.update(id, patch): Task | undefined         // handles completion bookkeeping + status moves
taskRepository.move({ taskId, status, order }): Task | undefined
taskRepository.delete(id): boolean                         // cascades comments

resetTaskRepositoryForTests()      // wipe storage, restore pristine seed
rehydrateTaskRepositoryForTests()  // simulate reload: re-read storage
```

Ordering invariants: per-column `order` values stay gapless (`1..n`) across
create/move/delete; the drop slot requested by a drag always wins;
`completedAt` is set when a task enters `done` and cleared otherwise.

### `data/dataSource.ts`

Seed loading helpers for users, sprints and comments plus `nowIso()` used for
timestamps. Comments cascade-delete with their task.
