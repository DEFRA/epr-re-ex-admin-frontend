# Contributing

<!-- prettier-ignore-start -->

<!--toc:start-->

- [Requirements](#requirements)
  - [Node.js](#nodejs)
  - [Gitleaks](#gitleaks)
  - [Mise](#mise)
  - [Secrets](#secrets)
- [Documentation](#documentation)
  - [Architecture Decision Records (ADRs)](#architecture-decision-records-adrs)
- [Local development](#local-development)
  - [Setup](#setup)
  - [Testing](#testing)
  - [Development](#development)
  - [Production](#production)
  - [Npm scripts](#npm-scripts)
  - [Update dependencies](#update-dependencies)
  - [Formatting](#formatting)
    - [Windows prettier issue](#windows-prettier-issue)
- [Authentication](#authentication)
  - [Overview](#overview)
  - [How sign-in works](#how-sign-in-works)
  - [Session management and token refresh](#session-management-and-token-refresh)
  - [How authorisation works](#how-authorisation-works)
  - [Libraries and what they do](#libraries-and-what-they-do)
  - [Local development auth](#local-development-auth)
  - [Further reading](#further-reading)
- [Docker](#docker)
  - [Development image](#development-image)
  - [Production image](#production-image)
  - [Docker Compose](#docker-compose)
- [Logging and Auditing](#logging-and-auditing)
- [Repository](#repository)
  - [Pull Requests](#pull-requests)
  - [Dependabot](#dependabot)
  - [SonarCloud](#sonarcloud)
- [Deployments](#deployments)
  - [Secrets and Environment Variables](#secrets-and-environment-variables)
  - [Development Notes](#development-notes)
- [Further Documentation](#further-documentation)
<!--toc:end-->

<!-- prettier-ignore-end -->

## Requirements

### Node.js

This project is written in [Node.js](http://nodejs.org/) and uses [npm](https://npmjs.org/) to manage dependencies.

It uses [nvm](https://github.com/nvm-sh/nvm) to install and manage Node via a [.nvmrc](https://github.com/nvm-sh/nvm#nvmrc)
file which is set to reference the latest [Active LTS](https://nodejs.org/en/about/previous-releases) version.

To use the correct version of Node.js for this application, via nvm:

```bash
cd epr-re-ex-admin-frontend
nvm use
```

### Gitleaks

[Gitleaks](https://github.com/gitleaks/gitleaks) is required for pre-commit secret scanning and must be available on your PATH.

The simplest install on macOS/Linux is via [mise](#mise)

```bash
mise trust && mise install
```

Alternatively, install directly:

- macOS: `brew install gitleaks`
- Linux/Windows: see the [gitleaks releases page](https://github.com/gitleaks/gitleaks/releases)

### Mise

[mise](https://mise.jdx.dev/) - a polyglot version manager that reads `mise.toml` in this repo to install the correct pinned versions

1. [Install](https://mise.jdx.dev/getting-started.html#installing-mise-cli)
2. [Activate](https://mise.jdx.dev/getting-started.html#activate-mise) in your shell

### Secrets

Authentication with Azure Entra ID requires an `ENTRA_CLIENT_SECRET`. How you obtain this depends on which local development path you use — see [Local development auth](#local-development-auth) for details.

## Documentation

Please see the [root `README.md`](./README.md).

### Architecture Decision Records (ADRs)

ADRs affecting this service must, for the time being, be placed in the [epr-re-ex-service](https://github.com/DEFRA/epr-re-ex-service) repository together with all other ADRs for the global pERP Re-Ex project.

## Local development

### Setup

Install application dependencies:

```bash
npm install
```

### Testing

Unit tests can be run with:

```bash
npm test
```

By default, tests run with `v8` for code coverage. You can opt-in to using `istanbul` by setting `PREFER_ISTANBUL_COVERAGE="true"` in your environment.

### Development

> [!TIP]
> You probably won't need this command as you're more likely to need a stack of docker containers running via compose,
> [see below on how to run and access them](#docker-compose).

To run the application in `development` mode run:

```bash
npm run dev
```

### Production

To mimic the application running in `production` mode locally run:

```bash
npm start
```

### Npm scripts

All available Npm scripts can be seen in [package.json](./package.json).
To view them in your command line run:

```bash
npm run
```

### Update dependencies

> [!TIP]
> You probably won't need this command as you're more likely to rely on Dependabot,
> [see below for more info](#dependabot).

To update dependencies use [npm-check-updates](https://github.com/raineorshine/npm-check-updates):

> The following script is a good start. Check out all the options on
> the [npm-check-updates](https://github.com/raineorshine/npm-check-updates)

```bash
ncu --interactive --format group
```

### Formatting

#### Windows prettier issue

If you are having issues with formatting of line breaks on Windows update your global git config by running:

```bash
git config --global core.autocrlf false
```

## Authentication

### Overview

Admin UI authenticates users via [Azure Entra ID](https://learn.microsoft.com/en-us/entra/identity/) (formerly Azure Active Directory) using the OAuth 2.0 / OpenID Connect (OIDC) protocol. This is separate from the public-facing EPR frontend, which uses Defra ID — a completely different identity provider.

The app uses a **secrets-based approach** (client ID + client secret) to authenticate with Entra ID. This was chosen over federated authentication for faster initial delivery — see [ADR-0009](https://github.com/DEFRA/epr-re-ex-service/blob/main/docs/architecture/decisions/0009-admin-ui-approach-for-authenticating-with-azure-ad.md) for the full rationale.

Two Hapi auth strategies are registered in `src/server/plugins/auth-plugin.js`:

1. **`entra-id`** — a [Bell](https://hapi.dev/module/bell/) strategy that handles the OIDC redirect flow with Azure
2. **`session`** — a [Cookie](https://hapi.dev/module/cookie/) strategy that validates sessions on every request

The `session` strategy is set as the **default**, meaning all routes require an authenticated session unless explicitly opted out with `auth: false`.

### How sign-in works

1. User requests a protected page (e.g. `/organisations`)
2. The `session` (cookie) strategy finds no valid session
3. The `session` strategy has `redirectTo: false`, so it returns a `401`. The global error handler (`errors.js`) catches this and renders an "Unauthorised" page with a sign-in link. The original request path is stashed in `yar` flash so the user can be redirected back after login
4. User clicks the sign-in link. `/auth/sign-in` uses the `entra-id` strategy, which triggers Bell to redirect the user to Azure's login page
5. User authenticates with Azure (username/password, or SSO if already signed in)
6. Azure redirects back to `/auth/callback` with a one-time authorisation code
7. Bell exchanges the code for a JWT access token and refresh token (using the client secret)
8. Bell's profile hook verifies the JWT signature against Azure's public keys (JWKS) using `jose`, and extracts user details (`oid`, `name`, `preferred_username`). The callback handler then creates a server-side session from these verified credentials
9. User is redirected to the page they originally requested

Sign-out (`/auth/sign-out`) clears the local session and renders an interstitial page whose client-side script redirects the browser to Azure's logout endpoint to end the SSO session.

### Session management and token refresh

Sessions are stored server-side using `@hapi/yar` backed by Redis in deployed environments (in-memory locally). The browser receives an encrypted session cookie containing a session ID that maps to the server-side data.

Access tokens issued by Azure have a limited lifetime. To avoid forcing users to re-authenticate mid-session, the cookie strategy's `validate` function checks whether the token is approaching expiry on every request. If the token age exceeds a threshold (currently 55 minutes of a 60-minute max), the app uses the stored refresh token to silently obtain a new access token from Azure via the `openid-client` library. If the refresh fails, the session is invalidated and the user must sign in again.

### How authorisation works

Authorisation is handled by the **backend**, not this frontend. The frontend's role is limited to:

1. Passing the user's access token to backend API calls via the `Authorization: Bearer` header
2. Rendering the response if the backend returns `2xx`
3. Showing a "not authorised" page if the backend returns `403`

The backend maintains a mapping of email addresses to roles (currently just `service_maintainer`) via CDP config. This is an MVP approach — see [ADR-0016](https://github.com/DEFRA/epr-re-ex-service/blob/main/docs/architecture/decisions/0016-admin-ui-authorisation-mvp.md) for details and the planned direction.

This means the frontend cannot conditionally render page elements based on roles (e.g. showing a button only for certain users). That's a known limitation of the current design.

### Libraries and what they do

| Library                                                   | Purpose                                                                                                                                                  |
| --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`@hapi/bell`](https://hapi.dev/module/bell/)             | Manages the OAuth 2.0 redirect flow with Azure — handles building the authorisation URL, receiving the callback, and exchanging the auth code for tokens |
| [`@hapi/cookie`](https://hapi.dev/module/cookie/)         | Provides the `session` auth strategy — validates the encrypted session cookie on every request                                                           |
| [`@hapi/yar`](https://hapi.dev/module/yar/)               | Server-side session storage, backed by `@hapi/catbox-redis` in production or `@hapi/catbox-memory` locally                                               |
| [`jose`](https://github.com/panva/jose)                   | Verifies JWT signatures against Azure's JWKS (public signing keys). Used during the Bell profile step to validate the access token                       |
| [`openid-client`](https://github.com/panva/openid-client) | Handles token refresh — discovers Azure's OIDC configuration and exchanges refresh tokens for new access tokens                                          |
| [`@hapi/crumb`](https://hapi.dev/module/crumb/)           | CSRF protection (not auth per se, but closely related to session security)                                                                               |

### Local development auth

There are two ways to authenticate locally, depending on whether you use the Entra ID stub or real Azure AD.

#### Option 1: Real Azure AD (Docker Compose default)

By default, Docker Compose points the admin frontend at the **real** Microsoft login endpoint. When you run `docker compose --profile all up`, you'll be redirected to the actual Azure sign-in page.

To use this path you need:

1. A valid `ENTRA_CLIENT_SECRET` — this is stored in AWS Secrets Manager under CDP. Ask the engineering team if you need help retrieving it. Export it before running compose, or add it to a `.env` file in the service repo.

2. A test account with access to the Azure AD tenant. Check the `SERVICE_MAINTAINER_EMAILS` variable in the service repo's `compose.yml` for the list of permitted accounts, and sign in with the appropriate credentials at the Azure login page.

#### Option 2: Local Entra ID stub

The Docker Compose stack includes an [Entra ID stub](https://github.com/DEFRA/epr-re-ex-entra-stub) service on port 3010, but the admin frontend **does not point to it by default**. To use it, override the following environment variables (e.g. via a `.env` file in the service repo or by exporting them):

```bash
export ENTRA_CLIENT_ID=clientId
export ENTRA_CLIENT_SECRET=test
export ENTRA_TENANT_ID=tenantId
export ENTRA_OIDC_WELL_KNOWN_CONFIGURATION_URL=http://localhost:3010/.well-known/openid-configuration
```

> **Note:** The stub expects `clientId`, `test`, and `tenantId` as its credentials — these are different from the real Azure values used by the default compose config.

The stub provides pre-configured test users:

| Email                  | Password | Name             | Role            |
| ---------------------- | -------- | ---------------- | --------------- |
| `ea@test.gov.uk`       | `pass`   | EA Regulator     | `EPR.Regulator` |
| `nrw@test.gov.uk`      | `pass`   | NRW Regulator    | `EPR.Regulator` |
| `niea@test.gov.uk`     | `pass`   | NIEA Regulator   | `EPR.Regulator` |
| `customer@test.gov.uk` | `pass`   | Regular Customer | `EPR.Customer`  |

Use the regulator accounts for admin functionality testing. The `customer@test.gov.uk` account lacks admin access and can be used to verify that unauthorised users are handled correctly.

For more detail, see the [admin local login guide](https://github.com/DEFRA/epr-re-ex-service/blob/main/docs/guides/admin-local-login.md).

### Further reading

- [ADR-0009: Admin UI approach for authenticating with Azure AD](https://github.com/DEFRA/epr-re-ex-service/blob/main/docs/architecture/decisions/0009-admin-ui-approach-for-authenticating-with-azure-ad.md) — why we chose secrets-based auth
- [ADR-0016: Admin UI authorisation MVP](https://github.com/DEFRA/epr-re-ex-service/blob/main/docs/architecture/decisions/0016-admin-ui-authorisation-mvp.md) — why authorisation is inferred from API responses
- [LLD: Admin UI authentication](https://github.com/DEFRA/epr-re-ex-service/blob/main/docs/architecture/discovery/pepr-lld-auth-admin-ui.md) — detailed sign-in/sign-out flow diagrams
- [LLD: API authentication](https://github.com/DEFRA/epr-re-ex-service/blob/main/docs/architecture/discovery/pepr-lld-auth-api.md) — how the backend validates tokens from both Entra ID and Defra ID

## Docker

### Development image

Build:

```bash
docker build --target development --no-cache --tag epr-re-ex-admin-frontend:development .
```

Run:

```bash
docker run -e PORT=3002 -p 3002:3002 epr-re-ex-admin-frontend:development
```

### Production image

Build:

```bash
docker build --no-cache --tag epr-re-ex-admin-frontend .
```

Run:

```bash
docker run -e PORT=3002 -p 3002:3002 epr-re-ex-admin-frontend
```

### Docker Compose

Use the compose setup in our [service repo](https://github.com/DEFRA/epr-re-ex-service/blob/main/CONTRIBUTING.md#docker-compose)

## Logging and Auditing

Logging and auditing must follow EPR's backend logging standards. See [the logging section](https://github.com/DEFRA/epr-backend/blob/main/CONTRIBUTING.md#logging)

## Repository

### Pull Requests

The repository is configured to only allow updates via Pull Requests, please ensure that you follow the [pull request standards](https://defra.github.io/software-development-standards/processes/pull_requests).

### Dependabot

Dependabot is configured for this repository. You can [find the configuration here](.github/dependabot.yml).

### SonarCloud

The project has been set up in SonarCloud and SonarCloud checks should start appearing in PRs as soon as 27/09/25.

## Deployments

Deployments are managed by CDP, speak with the engineering team to be briefed on this.

Deployments are conducted manually at present.

### Secrets and Environment Variables

Both secrets and environment variables are managed by CDP, speak with the engineering team to be briefed on this.

### Development Notes

- API keys are stored securely in CDP — never commit them to the repo. See [Secrets](#secrets) for how to handle them.
- **CSRF Protection**: All forms with POST/PUT/DELETE methods must include CSRF tokens (`<input type="hidden" name="crumb" value="{{ crumb }}" />`). The `@hapi/crumb` plugin handles validation automatically.

## Further Documentation

This `CONTRIBUTING.md` focuses on repository-specific guidance such as setup, development, and deployment.

For wider engineering documentation (including runbooks, hotfix process, non-technical resources, and dummy data assets), please see our Confluence space:

[Engineering Documentation Home](https://eaflood.atlassian.net/wiki/spaces/MWR/pages/5895749782/Engineering)
