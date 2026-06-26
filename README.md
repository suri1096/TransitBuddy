# Transit Buddy

Transit Buddy is a full-stack accessibility-focused transit web app created as a team project for SNP-REACH. The app helps neurodivergent users navigate public transportation with clearer, calmer, step-by-step support.

Suri Li served as the primary full-stack developer, codebase owner, and repository maintainer, leading most of the app's technical implementation.

## Features

- Step-by-step public transit guidance designed to reduce confusion and overwhelm
- Traveler and caregiver modes for supportive trip monitoring
- Accessible interface with calm visual design and simple navigation prompts
- BART route data, station guidance, and trip-progress support
- Chat-based transit help for questions such as getting lost, finding platforms, and understanding routes

## Tech Stack

- Frontend: React, TypeScript, Vite, Tailwind CSS
- Backend: Node.js, Express, TypeScript
- Database: PostgreSQL with Drizzle ORM
- Package manager: pnpm workspaces

## Project Structure

```txt
artifacts/transit-buddy/   # React frontend
artifacts/api-server/      # Express API server
lib/                       # Shared API, database, and integration packages
pnpm-workspace.yaml        # Workspace configuration
```

## Running the Project

Install dependencies:

```bash
pnpm install
```

Run the API server in one terminal:

```bash
pnpm run dev:api
```

Run the frontend in a second terminal:

```bash
pnpm run dev:frontend
```

Then open the frontend URL shown in the terminal, usually `http://localhost:5173`.

The frontend dev server proxies `/api` requests to `http://localhost:8080` by default, so login, caregiver connections, location sharing, and chat can connect to the backend during local testing.

Some backend features require environment variables such as `DATABASE_URL`, `SESSION_SECRET`, and `OPENAI_API_KEY`. These are not included in the repository for security reasons. See `.env.example` for the expected variable names.

## Notes

This repository contains the project source code. Generated build artifacts, local cache files, and private environment variables are intentionally excluded.
