# Hasad API

Express 4 / MongoDB backend for users, folders, books and benefits (book notes).

## Setup

Use Node.js 24 LTS (`nvm use`). Run `npm ci`, copy `.env.example` to `.env`, and supply the database, JWT, Cloudinary and Gmail application-password settings. Start with `npm start`; `npm run dev` uses Node's watch mode. Never commit credentials. `ENVIRONMENT` takes precedence over `NODE_ENV`; production selects `PROD_DB_URL`. The default port is 3000. Production JWT secrets must have at least 32 characters.

## Existing API contract

The routes, HTTP methods, request field names and normal CRUD response shapes are preserved. All protected requests use `Authorization: Bearer <token>`.

| Resource       | Routes                                                                                                                           |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Authentication | `POST /api/auth/register`, `/login`, `/logout`                                                                                   |
| Verification   | `POST /api/auth/verify-user-request`, `/verify-user`                                                                             |
| Password reset | `POST /api/auth/reset-password-request`, `/reset-password`                                                                       |
| Profile image  | `POST` / `DELETE /api/auth/profile-picture`                                                                                      |
| Folders        | `GET` / `POST /api/folders`; `PUT` / `DELETE /api/folders/:id`                                                                   |
| Books          | `GET` / `POST /api/books` or `/api/folders/:folderId/books`; `PUT` / `DELETE .../:id`                                            |
| Benefits       | `GET` / `POST /api/books/:bookId/benefits`; `GET` / `PUT` / `DELETE .../:id`                                                     |
| Favourites     | `GET /api/books/benefits/favourites` or `/api/books/:bookId/benefits/favourites`; `PUT .../:id/favourite`, `.../:id/unfavourite` |

Nested benefits routes also work under `/api/folders/:folderId/books/:bookId/benefits`. Existing `sortBy=name|date` and `sortDirection=asc|desc` options remain unchanged. Lists still return complete arrays; pagination has not been imposed.

Registration fields are `first_name`, `last_name`, `email`, `password`, `verify_password`; login fields are `email`, `password`. Verification takes `verify_otp`; reset takes `otp`, `password`, `verify_password`. Password reset continues to require authentication. Optional images use multipart field `image`, JPEG/PNG, up to 5 MB. Benefits retain the existing `favourated` spelling and creation status 200.

Security corrections intentionally affect invalid or unsafe requests:

- Confirmation now compares with the submitted password. Responses and validation errors exclude password hashes, OTPs, stored tokens and submitted secrets.
- New JWTs expire after `JWT_EXPIRES_IN` (default `12h`). Logout and password reset revoke the user's sessions. Clients should handle 401 by clearing the token and returning to login. There is no refresh-token endpoint. A legacy token is accepted only within the same maximum age, when it matches the stored token and the account has never revoked sessions; legacy tokens are not renewed automatically.
- Email codes remain four-digit **strings**, including leading zeros. Each challenge is purpose-specific, hashed, valid for ten minutes, usable once, and limited to five attempts. Requests have a 60-second resend cooldown (429); expired/plaintext legacy codes must be requested again.
- Authentication routes have a per-process IP limit of 100 requests per fifteen minutes (429). Set `TRUST_PROXY_HOPS` only for a known reverse-proxy topology. Distributed deployments need a shared limiter store.
- Invalid JSON, invalid images and oversized uploads produce 4xx responses. Unexpected errors produce sanitized JSON 500 responses instead of accidentally returning 200 or escaping asynchronous handlers.

## Database rollout and asset cleanup

Back up MongoDB before deployment. Run `npm run db:check` against the intended database to report duplicate-email group counts without altering records. Resolve any duplicates deliberately, then run `npm run db:indexes`. The latter creates the unique email, query, OTP and cleanup indexes without dropping existing indexes. Email comparison remains case-sensitive to preserve existing account lookup behavior. Production disables automatic user/index migrations. The server ensures the new OTP challenge indexes exist before listening.

Creation, deletion, counters and replacement image cleanup use database transactions on replica sets (including Atlas) and sharded clusters. Standalone MongoDB remains usable, with awaited operations and insert compensation, but cannot provide atomic multi-document rollback. Use a replica set in production. Cascade deletion is owned by services, not model hooks: direct model deletes outside these services do not cascade.

Cloudinary deletions are recorded in the `assetcleanups` collection in the same database transaction as deletion/replacement. Cleanup is attempted after the operation and once per minute on the persistent server; failures stay queued with backoff. Monitor queue size, oldest task and attempt counts. Existing public URLs are retained; cleanup validates the configured Cloudinary cloud and `hasad/` folder. Serverless deployments require a separately scheduled cleanup worker and should be validated before use.

For legacy counter drift, pause application writes, take a backup, and run `npm run db:reconcile`. It updates counters only; it does not remove orphan records or assets. Audit legacy orphans separately. A total database outage during compensation after an external upload can still require an asset reconciliation.

## Deployment and maintenance

The supported default is a persistent Node/container process. Build with `docker build -t hasad-api .` and run with `docker run --init --env-file .env -p 3000:3000 hasad-api`. The image runs as a non-root user and excludes `.env`, Git metadata and local dependencies. The process drains requests on SIGTERM/SIGINT and disconnects MongoDB. TLS termination, backups, restore drills, alerts and secret storage belong to the deployment environment. The home route remains unchanged; dedicated liveness/readiness endpoints have not been added to the public API.

Run `npm run check`, `npm run lint`, `npm run format:check`, and `npm audit` before releasing. `npm run format` applies formatting. GitHub CI uses the committed lockfile and checks syntax, lint, formatting and high/critical production dependency advisories. Dependabot opens dependency-update PRs. No test files are included; verify API behavior manually before releases. Configure GitHub required checks/branch protection and secret scanning in repository settings.

Potential later changes that require coordinated API/frontend work: unauthenticated forgotten-password recovery, refresh-token sessions, mandatory verification, and pagination. Existing request fields/routes have been kept to avoid requiring those changes now.
