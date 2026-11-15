# SWStack API (FastAPI + SQLite MVP)

This directory contains the minimum real backend loop for the SWStack Vue
frontend: cookie sessions, questions and answers, votes/bookmarks, tags,
developers, follows and the following feed, plus full-site search. It is built
to be consumed by the existing frontend with `VITE_USE_MOCK=false`.

This is intentionally a vertical slice, not the full 60-endpoint contract. See
[Remaining endpoints](#remaining-endpoints) for the gap.

## Requirements

- Python 3.13
- uv (tested with 0.11.25)

## Setup and run

```bash
cd server
uv sync
uv run uvicorn app.main:app --reload --port 8000
```

The API listens on `http://127.0.0.1:8000`. On startup it creates
`server/data/swstack.db` if needed and seeds it when empty. To reset the
demo data, stop the server and delete `server/data/swstack.db`.

Health check:

```bash
curl http://127.0.0.1:8000/api/health
# {"status":"ok"}
```

Run the tests (temporary SQLite database per test, never the dev database):

```bash
cd server
uv run pytest
```

Expected current result: `46 passed`.

## Frontend switch

Create `.env` in the repository root (not in `server/`):

```bash
VITE_USE_MOCK=false
VITE_API_BASE_URL=/api
```

`vite.config.ts` already proxies `/api` to `http://127.0.0.1:8000`, so the
browser talks to the same origin and the HttpOnly session cookie works without
cross-site cookie caveats. Start the frontend with `npm run dev` and the backend
on port 8000.

## Demo accounts

| Role  | Email                 | Password     | Seeded user |
| ----- | --------------------- | ------------ | ----------- |
| Admin | `admin@swstack.dev`   | `admin123`   | `luxing` (id 1) |
| Student | `student@swstack.dev` | `student123` | `suhe` (id 6) |

Email matching is case-insensitive. The admin has `role: "admin"` and
`canWriteColumns: true`; the student is a normal member. Other seeded users
exist for public content and profiles but do not have login passwords.

### Session behavior

- Login sets the `swstack_session` cookie: `HttpOnly`, `SameSite=Lax`, path `/`.
- `remember: true` adds `Max-Age` (30 days); `remember: false` uses a
  browser-scoped cookie and a 12-hour server-side expiry.
- Logout deletes the server session row and clears the cookie. It is
  idempotent for guests.
- Passwords use PBKDF2-HMAC-SHA256 (120k iterations) with a random salt.
- Session tokens are random opaque values; only their SHA-256 hashes are stored
  in the `sessions` table.

## Seeded data

The seed mirrors `src/mocks/data.ts` and `src/mocks/follows.ts` for IDs,
users, tags, question metadata, scores, accepted answers, comments, timestamps
and follow relationships. Question/answer prose is representative rather than
the full mock prose.

- 12 developers (IDs 1-12), including the two demo accounts.
- 12 tags with the mock question/weekly/follower base counts.
- 12 published questions (IDs 101-112), 20 answers, question and answer
  comments. Question 107 is intentionally unanswered.
- Student demo account (`suhe`) follows users `luxing`, `zhouqi`, `hejia` and
  tags `vue3`, `typescript`, `fastapi`.
- Admin demo account has question 102 bookmarked, matching the mock's
  `currentUser` state.

Core journeys work immediately after login: list/detail, ask, vote, bookmark,
answer, follow a user or tag, browse the following feed, and search with
suggestions/trending.

## Implemented endpoints

All paths match the root `README.md` contract. Successful responses are plain
JSON objects (the frontend transport accepts raw payloads or `{ "data": ... }`).
Errors are `{ "detail": "..." }` with a string message; validation errors are
normalized to the same shape.

| Method | Path | Notes |
| ------ | ---- | ----- |
| GET | `/api/health` | Public health check |
| POST | `/api/auth/login` | `{ email, password, remember }` -> `{ user }` + cookie |
| POST | `/api/auth/logout` | -> `{ success: true }` |
| GET | `/api/session/me` | Requires session -> `AuthUser`; guests get 401 |
| GET | `/api/questions` | `page`, `pageSize`, `sort`, `tag`, `q`; default 8, max 30 |
| GET | `/api/questions/{id}` | Public detail; increments `viewCount` |
| POST | `/api/questions` | Auth required; title >= 8, body >= 20, 1-5 tags |
| POST | `/api/questions/{id}/vote` | Auth required; `value` -1/0/1 |
| POST | `/api/questions/{id}/bookmark` | Auth required; `bookmarked` bool or omitted to toggle |
| POST | `/api/questions/{id}/answers` | Auth required; body >= 20 |
| POST | `/api/answers/{id}/vote` | Auth required; `value` -1/0/1 |
| GET | `/api/tags` | Public tag directory, sorted by question count |
| GET | `/api/users` | Public developer directory, sorted by reputation |
| GET | `/api/users/{handle}` | Public profile with top tags and recent questions |
| GET | `/api/me/follows` | Auth required -> `{ users: [handle], tags: [slug] }` |
| POST | `/api/users/{handle}/follow` | Auth required; toggles; self-follow 422 |
| POST | `/api/tags/{slug}/follow` | Auth required; toggles |
| GET | `/api/feed/following` | Auth required; `page`, `pageSize` (default 12, max 24) |
| GET | `/api/search` | Auth required; `q`, `type`, `sort`, `page`, `pageSize` |
| GET | `/api/search/suggest` | Auth required; `q`, `limit` (default 8, max 10) |
| GET | `/api/search/trending` | Auth required; top 8 tags by weekly count |
| GET | `/api/community/overview` | Public sidebar stats, popular tags and top members |
| GET | `/api/projects/board` | Public; reports `{ enabled: false }` until the projects slice lands |
| GET | `/api/notifications` | Auth required; `page`, `pageSize`, `filter=all\|unread` |
| GET | `/api/notifications/unread-count` | Auth required -> `{ unread }` |
| PATCH | `/api/notifications/{id}` | Auth required; `{ read: bool }` |
| POST | `/api/notifications/read-all` | Auth required -> `{ updated }` |

Pagination responses are always:

```json
{ "items": [], "total": 0, "page": 1, "pageSize": 8 }
```

Search follows the mock semantics: `type=all` returns up to 4 previews per
scope with `pageSize: 4`; a specific type paginates with default 8 and max 20.
Only public and active content is returned.

The following feed currently emits `type: "question"` items only, but in the
exact `FollowingFeedItem` shape (`id`, `type`, `createdAt`, `question`).

## Remaining endpoints

Not implemented in this slice (from the root API contract):

- Uploads: `POST /api/uploads/images`.
- Notifications: list, unread count, mark read, read-all. Answering someone
  else's question creates a `question_answered` notification for the author.
- Admin: overview, question management, user management, tag management,
  project review/management, column management.

Because projects and columns are absent:

- `GET /api/projects/board` always reports `enabled: false`, so the frontend
  hides project entry points instead of linking to pages the API cannot serve.
- `GET /api/search` returns `projects: []` and `columns: []` with counts `0`
  for those scopes. `type=projects` / `type=columns` is valid but empty.
- `GET /api/search/suggest` never emits `project` or `column` items.
- `GET /api/feed/following` never emits `column` or `projectUpdate` items.
- Tag detail pages work through `GET /api/questions?tag=<slug>`; there is no
  separate tag-detail endpoint in the frontend API layer.

## Configuration

Environment variables (all optional):

| Variable | Default | Purpose |
| -------- | ------- | ------- |
| `SWSTACK_DB_URL` | `sqlite:///./data/swstack.db` | SQLAlchemy database URL |
| `SWSTACK_CORS_ORIGINS` | `http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173,http://127.0.0.1:4173` | Comma-separated allowed origins |
| `SWSTACK_COOKIE_SECURE` | `false` | Set `true` behind HTTPS |

`DATABASE_URL` is also accepted as a fallback for `SWSTACK_DB_URL`.

## Notes and deliberate differences

- The backend validates vote values strictly (`-1`, `0`, `1` -> 422 otherwise),
  while the mock silently coerces invalid values to `0`. The frontend only sends
  valid values.
- Free-form tag slugs on a new question are accepted like the mock. They are
  stored with `status = "hidden"` so they do not appear in the public tag
  directory, matching the mock's visible behavior.
- This MVP has no CSRF token, rate limiting, email verification or password
  reset. The HttpOnly `SameSite=Lax` cookie plus the Vite same-origin proxy is
  the local-development model; add CSRF protection and HTTPS/Secure cookies
  before production.
- Admin role and account status are present on users, but there are no admin
  endpoints yet to change them.
