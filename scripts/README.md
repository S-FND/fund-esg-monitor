
# Environment Scripts

This directory contains scripts to run the application in different environments.

## Setup
Make the scripts executable:
```bash
chmod +x scripts/*.sh
```

## Usage

### Development Environment
```bash
./scripts/dev.sh
```
- Uses dev API URL: https://dev-api.fandoro.com
- Debug mode enabled
- Log level: debug

### Staging Environment
```bash
./scripts/stage.sh
```
- Uses stage API URL: https://stage-api.fandoro.com
- Debug mode enabled
- Log level: info

### Pre-production Environment
```bash
./scripts/preprod.sh
```
- Uses preprod API URL: https://preprod-api.fandoro.com
- Debug mode disabled
- Log level: warn

### Production Environment
```bash
./scripts/prod.sh
```
- Uses production API URL: https://api.fandoro.com
- Debug mode disabled
- Log level: error

## Alternative Usage with npm/yarn

You can also set the environment variable directly:

```bash
VITE_APP_ENV=stage npm run dev
VITE_APP_ENV=prod npm run build
```

## Environment Variables

Each environment configuration includes:
- `apiUrl`: Base API URL for the environment
- `environment`: Environment name
- `supabaseUrl`: Supabase URL (same across environments)
- `supabaseKey`: Supabase key (same across environments)
- `debug`: Whether debug mode is enabled
- `logLevel`: Logging level for the environment
