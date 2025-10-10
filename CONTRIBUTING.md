# Contributing

<!-- prettier-ignore-start -->

<!--toc:start-->

- [Contributing](#contributing)

  - [Requirements](#requirements)
    - [Node.js](#nodejs)
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

### Secrets

This repo does not require any secrets yet. This section will be updated when it does.

## Documentation

Please see the [root `README.md`](./README.md).

### Architecture Decision Records (ADRs)

ADRs affecting this service must, for the time being, be placed in the `epr-backend` repository together with all other ADRs for the global pERP Re-Ex project.

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

> [!IMPORTANT]
>
> Please ensure you have at least version 2.22.0 of Docker Compose installed.

A local environment with:

- Localstack for AWS services (S3, SQS)
- Redis
- This service.
- A commented out backend example.

```bash
docker compose up --build -d --watch
```

See the running services with:

```bash
docker compose ps
```

### Logging and Auditing

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

## Further Documentation

This `CONTRIBUTING.md` focuses on repository-specific guidance such as setup, development, and deployment.

For wider engineering documentation (including runbooks, hotfix process, non-technical resources, and dummy data assets), please see our Confluence space:

[Engineering Documentation Home](https://eaflood.atlassian.net/wiki/spaces/MWR/pages/5895749782/Engineering)
