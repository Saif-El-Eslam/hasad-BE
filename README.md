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
- Authentication routes have a shared MongoDB-backed IP limit of 100 requests per fifteen minutes (429). Set `TRUST_PROXY_HOPS` only for a known reverse-proxy topology. All instances using the same database share the same quota; no Redis deployment is needed.
- Invalid JSON, invalid images and oversized uploads produce 4xx responses. Unexpected errors produce sanitized JSON 500 responses instead of accidentally returning 200 or escaping asynchronous handlers.

## Database rollout and asset cleanup

Back up MongoDB before deployment. Run `npm run db:check` against the intended database to report duplicate-email group counts without altering records. Resolve any duplicates deliberately, then run `npm run db:indexes`. The latter creates the unique email, query, OTP and cleanup indexes without dropping existing indexes. Email comparison remains case-sensitive to preserve existing account lookup behavior. Production disables automatic user/index migrations. The server ensures the new OTP challenge indexes exist before listening.

Creation, deletion, counters and replacement image cleanup use database transactions on replica sets (including Atlas) and sharded clusters. Standalone MongoDB remains usable, with awaited operations and insert compensation, but cannot provide atomic multi-document rollback. Use a replica set in production. Cascade deletion is owned by services, not model hooks: direct model deletes outside these services do not cascade.

Cloudinary deletions are recorded in the `assetcleanups` collection in the same database transaction as deletion/replacement. Cleanup is attempted after the operation and once per minute on the persistent server; failures stay queued with backoff. Monitor queue size, oldest task and attempt counts. Existing public URLs are retained; cleanup validates the configured Cloudinary cloud and `hasad/` folder. Serverless retries use the authenticated cron endpoint described below. Workers claim each task with an expiring lease so concurrent instances do not process the same task simultaneously.

For legacy counter drift, pause application writes, take a backup, and run `npm run db:reconcile`. It updates counters only; it does not remove orphan records or assets. Audit legacy orphans separately. A total database outage during compensation after an external upload can still require an asset reconciliation.

## Deployment and maintenance

The supported default is a persistent Node/container process. Build with `docker build -t hasad-api .` and run with `docker run --init --env-file .env -p 3000:3000 hasad-api`. The image runs as a non-root user and excludes `.env`, Git metadata and local dependencies. The process drains requests on SIGTERM/SIGINT and disconnects MongoDB. TLS termination, backups, restore drills, alerts and secret storage belong to the deployment environment. The home route remains unchanged; dedicated liveness/readiness endpoints have not been added to the public API.

Run `npm run build` (native dependency check), `npm run check`, `npm run lint`, `npm run format:check`, and `npm audit` before releasing. `npm run format` applies formatting. GitHub CI uses the committed lockfile and checks native dependency loading, syntax, lint, formatting and high/critical production dependency advisories. Dependabot opens dependency-update PRs. No test files are included; verify API behavior manually before releases. The GitHub main branch requires the existing Quality `check`, disallows force pushes/deletion, and retains admin bypass; Dependabot security fixes and existing secret scanning/push protection are enabled.

Potential later changes that require coordinated API/frontend work: refresh-token sessions, mandatory verification, and pagination. Existing request fields/routes have been kept to avoid requiring those changes now.

## Additive public password recovery

The authenticated `/reset-password-request` and `/reset-password` endpoints retain their original behavior and four-digit codes. Two new endpoints work without a JWT:

- `POST /api/auth/forgot-password-request` takes `{ "email": "person@example.com" }` and always returns HTTP 200 with `{ "message": "If the account exists, a password reset email has been sent" }` for known/unknown accounts, cooldowns and mail failures. Invalid input remains 400 and the shared IP quota remains 429.
- `POST /api/auth/forgot-password` takes `{ "email": "person@example.com", "otp": "001234", "password": "new-password", "verify_password": "new-password" }`. These new codes are six-digit strings, expire after ten minutes, allow five attempts, are purpose-specific and single-use. Success returns the existing password-reset success message and revokes old sessions. Public recovery enforces bcrypt's 72-byte password limit; existing authenticated endpoint validation is unchanged.

Recovery mail is queued with an encrypted code in MongoDB rather than blocking the generic response on SMTP. Delivery starts immediately; Vercel's `waitUntil` keeps that work alive after the response, and persistent/scheduled workers retry failures. Expired or superseded challenges are never emailed by retry workers. This new collection uses the unchanged JWT secret to derive an encryption key; rotating that secret intentionally invalidates queued delivery and sessions, so plan rotation separately. Delivery is at least once: a crash after SMTP delivery may cause the same code to be emailed again, but the code can still be consumed only once.

Existing frontend integrations require no endpoint changes. A frontend that adds forgotten-password UI should use the two new endpoints and a six-digit input; it should return to login after a successful reset.

## Production preflight, duplicate accounts and indexes

Run `ENVIRONMENT=production npm run ops:preflight`. `ENVIRONMENT=production npm run ops:providers` additionally performs read-only Gmail authentication and Cloudinary ping checks: it sends no mail and uploads/deletes no assets. `PASSWORD` is accepted as a legacy Gmail application-password alias; `GOOGLE_APP_PASSWORD` takes precedence. Preflight prints only status/error codes, never credentials. Use the live deployment's settings; a stale local `.env` does not prove the deployed settings are wrong. Do not replace a running JWT secret simply to bypass a preflight failure.

Run `ENVIRONMENT=production npm run db:check`, then optionally `ENVIRONMENT=production npm run db:duplicates -- --report /private/path/duplicates.json`. The report is created exclusively with mode 0600 and lists duplicate account IDs, dates, verification status and resource counts. It excludes credentials and makes no record/session/ownership changes. Duplicate accounts are not automatically merged or deleted: even identical email addresses do not establish which password, ID or owned records running clients depend on. Review those groups against a verified backup before deciding account-specific resolution. `db:indexes` refuses to proceed if duplicates remain, preserves existing indexes, and builds query/unique-email/TTL indexes after resolution.

## Monitoring and scheduled maintenance

- `GET /internal/health/live` returns minimal liveness without depending on MongoDB.
- `GET /internal/health/ready` and `/internal/metrics` require `Authorization: Bearer <OPERATIONS_SECRET>`. Readiness checks MongoDB. Metrics expose only process uptime and aggregate cleanup/recovery queue counts/age.
- `GET` or `POST /internal/jobs/asset-cleanup` requires `Authorization: Bearer <CRON_SECRET>` and runs bounded leased cleanup and recovery-mail retries. Wrong secrets return 401; unconfigured protected operational routes return 404. Failures return 503 so schedulers can alert/retry. CLI `ENVIRONMENT=production npm run ops:cleanup` retries asset cleanup directly.

`vercel.json` supplies a daily cleanup fallback compatible with basic cron plans; Vercel sends `CRON_SECRET` automatically as a Bearer header. A daily fallback alone is insufficient for prompt mail retries: enable the five-minute GitHub Operations workflow, use a higher-frequency Vercel schedule on a compatible plan, or use the persistent server's minute worker. [Vercel cron authentication](https://vercel.com/docs/cron-jobs/manage-cron-jobs), [Vercel background work](https://vercel.com/docs/functions/functions-api-reference/vercel-functions-package).

The Operations workflow is disabled until repository variable `OPERATIONS_ENABLED=true`. Configure `API_BASE_URL`, secrets `CRON_SECRET` and `OPERATIONS_SECRET` matching the deployment, and optionally `CLEANUP_QUEUE_ALERT_THRESHOLD` (default 100). It checks readiness, drains queues, and fails if queue size/age exceeds thresholds. GitHub Actions scheduled runs may be delayed; use deployment monitoring for strict availability guarantees. Request logs now contain safe route patterns, status, request IDs and timestamps in production without bodies or authorization headers. Configure workflow failure notifications and provider alerts for your operations team; no outbound alert addresses are assumed.

## Encrypted backups and restore drills

`ENVIRONMENT=production npm run ops:backup` creates a gzip MongoDB logical archive encrypted with AES-256-GCM, authenticating its header and contents. Configure a private persistent `BACKUP_DIR` and separate 64-character hexadecimal `BACKUP_ENCRYPTION_KEY`. `BACKUP_DB_URL` can explicitly select the source database and must contain its database name. Credentials are passed through a private temporary configuration file, never command-line arguments; final files use mode 0600, and failed partial files are removed. Docker tools run as the caller with host networking on Linux; use `MONGO_TOOLS_MODE=native` with installed `mongodump`/`mongorestore` on other hosts. Keep the encryption key outside the backup destination and retain it in a secure vault.

`npm run ops:restore-check -- /private/path/backup.archive.enc` decrypts and authenticates an archive without database writes. Add `--restore` only for a restore drill, with `RESTORE_DB_URL` pointing to an isolated database, `RESTORE_CONFIRM_DATABASE_NAME` matching that database, and a target name different from the archived database. Authentication completes before restoration begins. No `--drop` is used; a failed restore must be inspected and the test database discarded. Run drills regularly and verify representative account/book/benefit counts and ownership, not just tool exit status.

The daily Encrypted database backup workflow is disabled until `BACKUPS_ENABLED=true`. Configure repository secrets `PROD_DB_URL` and `BACKUP_ENCRYPTION_KEY`; variables `BACKUP_S3_URI`, `AWS_BACKUP_ROLE_ARN`, `AWS_BACKUP_REGION`; and an AWS OIDC trust/least-privilege role limited to the backup prefix. It creates and authenticates the encrypted archive, then uploads it with additional S3 server-side encryption. Configure bucket public-access blocking, versioning, retention/lifecycle policy, and alerts before enabling it. It uses OIDC rather than permanent AWS keys. No production archive is published as a GitHub artifact.

Logical dumps while writes continue are not guaranteed to be point-in-time consistent across collections. Enable Atlas/provider snapshot and point-in-time recovery separately for production consistency; verify that policy in the provider account. Logical encrypted exports supplement those snapshots. No automatic account deletion, archive pruning, secret rotation, backup-bucket creation or deployment is performed by application startup.
