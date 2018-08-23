# Chevre Backend Application

[![CircleCI](https://circleci.com/gh/chevre-jp/backend.svg?style=svg)](https://circleci.com/gh/chevre-jp/backend)

## Table of contents

* [Usage](#usage)
* [License](#license)

## Usage

### Environment variables

| Name           | Required | Value            | Purpose                |
|----------------|----------|------------------|------------------------|
| `DEBUG`        | false    | chevre-backend:* | Debug                  |
| `NODE_ENV`     | true     |                  | Environment name       |
| `MONGOLAB_URI` | true     |                  | MongoDB Connection URI |
| `REDIS_PORT`   | true     |                  | Redis Cache Connection |
| `REDIS_HOST`   | true     |                  | Redis Cache Connection |
| `REDIS_KEY`    | true     |                  | Redis Cache Connection |

## License

ISC
