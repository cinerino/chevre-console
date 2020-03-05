# Chevre Console

[![CircleCI](https://circleci.com/gh/chevre-jp/backend.svg?style=svg)](https://circleci.com/gh/chevre-jp/backend)

## Table of contents

* [Usage](#usage)
* [License](#license)

## Usage

### Environment variables

| Name                          | Required | Value            | Purpose                  |
| ----------------------------- | -------- | ---------------- | ------------------------ |
| `DEBUG`                       | false    | chevre-backend:* | Debug                    |
| `NODE_ENV`                    | true     |                  | Environment name         |
| `MONGOLAB_URI`                | true     |                  | MongoDB Connection URI   |
| `REDIS_PORT`                  | true     |                  | Redis Cache Connection   |
| `REDIS_HOST`                  | true     |                  | Redis Cache Connection   |
| `REDIS_KEY`                   | true     |                  | Redis Cache Connection   |
| `REDIS_TLS_SERVERNAME`        | false    |                  | Redis Cache Connection   |
| `API_ENDPOINT`                | true     |                  |                          |
| `API_AUTHORIZE_SERVER_DOMAIN` | true     |                  |                          |
| `API_CLIENT_ID`               | true     |                  |                          |
| `API_CLIENT_SECRET`           | true     |                  |                          |
| `API_CODE_VERIFIER`           | true     |                  |                          |
| `PROJECT_ID`                  | true     |                  | Project ID               |
| `USE_ACCOUNT_TITLE`           | false    | 1 or 0           | Account Title usage flag |
| `USE_COA`                     | false    | 1 or 0           | COA usage flag           |
| `USE_OFFER_ADD_ON`            | false    | 1 or 0           | Offer add-on usage flag  |

## License

ISC
