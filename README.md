# WT-AQA-TECH-TASK — Playwright + JavaScript

Automated UI and API tests for [PayDo](https://paydo.com/), built with **Playwright** and
**JavaScript** on the **Page Object Model** with **test fixtures**.

## What is covered

| # | Scenario | Spec |
|---|---|---|
| 1 | Open https://paydo.com/, click **Open account**, verify all UI elements of the sign-up screen | [tests/ui/open-account.spec.js](tests/ui/open-account.spec.js) |
| 2 | Open the **Log In** page, submit invalid data, verify the error messages | [tests/ui/login-invalid-credentials.spec.js](tests/ui/login-invalid-credentials.spec.js) |
| 3.1 | `GET /user` — returns `user_id`, `username` (string), `age` (integer 1-100) | [tests/api/get-user.spec.js](tests/api/get-user.spec.js) |
| 3.2 | `POST /user` — accepts `username` (string), `age` (integer 1-100), `user_type` (boolean); returns `user_id`, `username` | [tests/api/post-user.spec.js](tests/api/post-user.spec.js) |

34 tests in total: 10 UI and 24 API, plus a one-test preflight the UI suite depends on. Two of the
UI tests describe the same screen in the two regions PayDo serves it differently, so exactly one of
them runs — see [Region restriction](#region-restriction).

## Prerequisites

Windows, macOS and Linux are all fine — nothing in the suite is platform-specific.

| Needed | Why |
|---|---|
| **Node.js 20+** and npm (`node -v`) | Playwright 1.62 requires Node 20 or newer |
| **Git** | To clone the repository |
| **~500 MB of disk** | Chromium is downloaded by `playwright install` |
| **Outbound HTTPS** to `paydo.com` and `account.paydo.com`, from a network PayDo serves | The UI project drives the live site; PayDo blocks datacenter IPs (see [CI](#ci)). The API project needs no internet at all |
| **A free local port** — `4017` by default | The bundled mock service listens there; change it with `MOCK_API_PORT` |

No database, Docker, account or credentials are required, and the suite runs with no `.env` file.

## Getting started

```bash
npm ci
npx playwright install chromium
```

Optional: copy `.env.example` to `.env` to override any default (`cp` on macOS/Linux, `copy` in
a Windows shell). Every value has a working default, so this can be skipped.

On a bare Linux machine or CI image, add `--with-deps` to pull the OS libraries Chromium needs
(`npx playwright install --with-deps chromium` — it calls the system package manager, so it may ask
for sudo). Windows and macOS do not need it.

```bash
npm test               # everything
npm run test:api       # API only, no browser needed
npm run test:ui        # UI only
npm run test:headed    # UI with a visible browser
npm run test:debug     # Playwright inspector
npm run report         # open the HTML report of the last run
npm run lint           # ESLint
```

Filter by tag or name:

```bash
npx playwright test --grep @api
npx playwright test --grep "Open account"
```

## Project structure

```
.
├── mock-api/                       # Reference implementation of the Users API
│   ├── server.js                   #   HTTP layer (dependency-free node:http)
│   └── users-store.js              #   Storage + contract rules
├── src/
│   ├── api/
│   │   ├── base-api-client.js      # Transport: normalised {status, body, headers}
│   │   ├── user-api-client.js      # One method per endpoint
│   │   └── schemas/                # Response contracts
│   ├── config/environment.js       # All URLs/ports, env-overridable
│   ├── data/                       # Test data: generators, datasets, expected copy
│   ├── fixtures/
│   │   ├── ui-fixtures.js          # Page-object fixtures
│   │   ├── api-fixtures.js         # API client + created-user fixtures
│   │   └── index.js                # Merged `test` + extended `expect`
│   ├── pages/
│   │   ├── base-page.js            # Navigation, cookie handling, expectLoaded()
│   │   ├── home-page.js
│   │   ├── sign-up-page.js
│   │   ├── login-page.js
│   │   └── components/             # Reusable pieces: cookie banner, form field
│   └── utils/                      # Logger, schema validator, custom matchers
└── tests/
    ├── ui/                         # Browser specs
    ├── api/                        # API specs
    └── preflight/                  # Is the site reachable? A dependency of the UI project
```

### How it fits together

**Page Object Model.** Every page extends [`BasePage`](src/pages/base-page.js), which supplies
`open()`, cookie handling and the `expectLoaded()` contract. Locators are getters, actions are
methods, and assertions on a page's own structure live in the page object — so specs read as
scenarios, not as selector lists.

**Components.** Markup shared across pages is its own class:
[`CookieConsent`](src/pages/components/cookie-consent.js) for the consent banner and
[`FormField`](src/pages/components/form-field.js) for one field of an auth form (input, label,
inline error). Field-level markup details are therefore declared once.

**Fixtures.** Specs declare what they need and get it ready-made — no `new PageObject(page)` in
test bodies. [`src/fixtures/index.js`](src/fixtures/index.js) merges the UI and API fixture sets,
so a spec may use both:

| Fixture | Provides |
|---|---|
| `homePage`, `signUpPage`, `loginPage` | Page object, not navigated |
| `openedHomePage`, `openedLoginPage` | Page object, navigated and past the cookie banner |
| `userApi` | `UserApiClient` bound to the API base URL |
| `createUser` | Factory: `createUser({ age: 1 })` arranges a user and fails the test if the setup itself broke |
| `createdUser` | The common case — one valid user already created, plus the payload used |

**Custom matcher.** `expect(body).toMatchSchema(schema)` validates a response against the
contracts in [src/api/schemas](src/api/schemas/user.schemas.js) and reports every violation at
once, instead of a chain of per-field type assertions. Validation runs on
[Ajv](https://ajv.js.org/) ([src/utils/schema-validator.js](src/utils/schema-validator.js)), so
contracts may use the whole JSON Schema vocabulary and compiled validators are cached per schema.

### Adding new tests

| To add… | Do this |
|---|---|
| A test for an existing page | Add a `test()` to the relevant spec; the fixtures are already there |
| A new page | Extend `BasePage`, add a fixture in `ui-fixtures.js` |
| A new endpoint | Add a method to `UserApiClient` (or a new `BaseApiClient` subclass) plus a schema |
| Another data case | Append an entry to `src/data/login-data.js` / `src/data/user-api-data.js` — the specs iterate over them |
| A browser or device | Add a project to `playwright.config.js` with `testDir: './tests/ui'` |

## Locator strategy

The marketing site is addressed through roles and accessible names
(`getByRole('link', { name: 'Open account' })`). The customer area is an Angular app whose
component library exposes stable `datatestname` / `datatestrole` attributes, which
[`FormField`](src/pages/components/form-field.js) uses instead of the generated
`mat-input-*` ids.

Three places fall back to markup hooks, because the elements carry neither an accessible name nor
a test attribute: the log-in error banner (`ngp-info-block.mat-error`), the password-policy hints
(`.ngp-field-requirements-item__label`) and the third-party consent overlay (`#termly-overlay`).
They are isolated in single getters, so a class rename is a one-line change.

## The Users API

The task specifies the two endpoints but no host to call them on, so this repo ships a reference
implementation in [mock-api/](mock-api/server.js) and Playwright boots it as a `webServer`.
It is dependency-free (`node:http` only) and implements exactly the documented contract:

| Endpoint | Response |
|---|---|
| `GET /user?user_id=<id>` | `200 {user_id, username, age}` · `400` missing/blank id · `404` unknown id |
| `POST /user` `{username, age, user_type}` | `201 {user_id, username}` · `400` invalid payload |
| `GET /health` | `200 {status: 'ok'}` |

Validation: `username` a non-empty string of at most 64 characters, `age` an integer within
1-100, `user_type` a boolean, no unexpected properties.

**The specs do not depend on it.** Every test arranges its own data through `POST /user` (the
`createUser` / `createdUser` fixtures) instead of reading ids the mock happens to seed, so the
same specs run unchanged against a deployed service — set `API_BASE_URL` and the mock is never
started:

```bash
API_BASE_URL=https://api.example.com npm run test:api
```

The two users the mock seeds at start-up exist only so the service can be explored by hand
(`npm run mock-api` + curl).

Worth stating plainly at review time: because the mock and the assertions are two readings of the
same written contract, these tests prove the client, the fixtures and the schema layer work — they
cannot discover a bug in a real implementation. The next step for a real project is contract-first:
one OpenAPI document, served by Prism/WireMock as the mock *and* used to generate the schemas, so
the mock cannot drift from what the tests assert.

## Configuration

Everything environment-dependent is resolved in
[src/config/environment.js](src/config/environment.js), which also loads `.env` — so the Playwright
config and a standalone `npm run mock-api` see the same values. Real environment variables (CI)
always win. See [.env.example](.env.example):

| Variable | Default | Purpose |
|---|---|---|
| `MARKETING_BASE_URL` | `https://paydo.com` | Public site |
| `ACCOUNT_BASE_URL` | `https://account.paydo.com` | Sign-up / log-in |
| `API_BASE_URL` | *(empty → start the mock)* | Users API under test |
| `MOCK_API_PORT` | `4017` | Port of the bundled mock service |
| `PERSONAL_ACCOUNTS_AVAILABLE` | *(empty → detect)* | `true`/`false` asserts the sign-up form state instead of skipping |
| `TEST_TIMEOUT` / `EXPECT_TIMEOUT` | `90000` / `10000` | Browser-test budgets, in ms |
| `API_TEST_TIMEOUT` / `API_EXPECT_TIMEOUT` | `15000` / `5000` | API-test budgets — tighter, so a hung request fails fast |
| `WORKERS` / `RETRIES` | Playwright defaults / `2` on CI | Parallelism and retries |
| `DEBUG_LOGS` | `false` | Print API request/response details |

## Reporting

`list` for the console, `html` in `playwright-report/` and `junit` in `results.xml`. Traces are
captured on first retry, videos and screenshots on failure. `npm run report` opens the HTML
report.

## CI

[.github/workflows/ci.yml](.github/workflows/ci.yml) lints, then runs the API contract tests — both
on every push and pull request, both required. They are deterministic and need no network beyond
npm, so a red build always means a real regression.

**The browser suite is manual and non-blocking**, because it cannot run on GitHub-hosted runners:
PayDo refuses datacenter IP ranges and redirects every request to `blocked.paydo.com`. Run it from
the Actions tab (*Run workflow*) on a self-hosted runner, or locally with `npm run test:ui`. On a
hosted runner the `ui-preflight` project detects the block and says so in one line, instead of
producing a dozen unrelated locator timeouts:

```
https://paydo.com redirected to https://blocked.paydo.com/. PayDo blocks this network — typically
a datacenter IP such as a GitHub-hosted runner.
```

That is a deliberate trade: a green badge that reflects what CI genuinely verifies, plus an
explicit reason the rest is not verified there — rather than a permanently red build, or a suite
that skips itself and reports success while testing nothing.

Reports are uploaded as artifacts for both jobs.

## Notes on the application under test

### Region restriction

PayDo does not offer personal accounts in every country. Where it does not, the sign-up form
still renders but is disabled, behind the notice *"Personal accounts are currently not offered in
your region."* Both states are correct product behaviour, so which one to expect is a
configuration decision rather than something a test discovers and quietly works around:

| `PERSONAL_ACCOUNTS_AVAILABLE` | Behaviour |
|---|---|
| `true` | Only the *editable form* test runs — and fails if the restriction notice appears |
| `false` | Only the *restricted form* test runs, asserting the notice and the disabled state |
| unset | The *editable form* test runs, and skips itself if it finds the notice |

The UI-elements test of scenario 1 is unaffected: it asserts **visibility**, which holds either
way — exactly what the task asks for.

### The cookie banner is injected late

The consent banner (Termly) draws a full-page overlay that intercepts clicks, and on a slow load
it can appear *after* the page is otherwise interactive — dismissing it once on `open()` is not
enough. [`CookieConsent`](src/pages/components/cookie-consent.js) therefore also exposes
`ensureDismissed()`, which pages call immediately before submitting a form; it waits for the
overlay itself, not just the dialog, and is a no-op when nothing is there.

### Log-in validation happens in two layers

The **Log in** button stays disabled until client-side validation passes, so a malformed email
never reaches the backend. The specs therefore assert both layers: the inline field error plus a
disabled button for malformed input, and the backend banner *"The email address or password you
entered is incorrect"* for well-formed credentials that do not belong to an account. The negative
log-in uses a freshly generated address each run, so it can never touch a real account or trip a
lockout counter.
