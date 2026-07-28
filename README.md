# Memory Guard Web

React + Vite + TypeScript + MUI client for the Go MemoryGuard server.

## Stack

- React 19
- Vite
- MUI (Material UI)
- React Router
- Cookie-based JWT auth (`credentials: 'include'`) against `http://localhost:3033`

## Setup

From this `frontend/` directory:

```bash
cp .env.example .env
npm install
npm run dev
```

Open `http://localhost:5173`. Start the Go server on port `3033` first.

## Features

- Login / register (`POST /users/login`, `POST /users`)
- Memory nodes list + create + detail (children, cards, priorities, groups)
- Cards table, create/edit dialog, delete
- Card inspector
- Quiz session (`cards-by-query`, keyboard 1/2/5, bulk `update-cards-field`)
- Navigate by node id, alias, or `c <cardId>`

Old Angular reference UI lives in `temp/`.
