# Turing Machine Study App

Interactive practice for theory-of-computation courses.

## MVP (current)

- **Next-transition** mode: pick the correct δ each step; tape and diagram update after each correct answer.
- **Tape-result** mode: pick the full configuration (state + tape + head) after **one** step; options are built from the engine with plausible distractors (`src/lib/grading/tapeResult.ts`).
- **Exercise pack** in `src/content/exercises/pack.ts` (sorted by difficulty). Use the header **Exercise** dropdown to switch problems.
- Machines live in `src/content/machines/`; hints in `src/content/hints.ts`.

---

## Local development (without Docker)

```bash
npm install
npm run dev
```

Open **http://localhost:5173**

```bash
npm test
npm run build
```

---

## Docker

Prerequisites: [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/) v2.

### Development (hot reload)

Mounts the project directory into the container and runs the Vite dev server.

```bash
docker compose up --build
```

- **URL:** http://localhost:5173  
- **Port:** host `5173` → container `5173`  
- Edit files on the host; Vite reloads in the browser.  
- Stop: `Ctrl+C` or `docker compose down`.

Rebuild after changing `package.json` / lockfile:

```bash
docker compose build --no-cache app && docker compose up
```

### Production: build image

```bash
docker compose --profile prod build
```

### Production: run container

```bash
docker compose --profile prod up --build
```

Or run in the background:

```bash
docker compose --profile prod up --build -d
```

- **URL:** http://localhost:8080  
- **Port:** host `8080` → nginx `80` (static files from `npm run build`)  
- Stop: `docker compose --profile prod down`

### One-off production image (optional)

```bash
docker build -f Dockerfile.prod -t algo-theory:prod .
docker run --rm -p 8080:80 algo-theory:prod
```

---

## Project layout (high level)

| Path | Role |
|------|------|
| `src/` | React + Vite app |
| `Dockerfile.dev` | Dev image (Node + `npm run dev`) |
| `Dockerfile.prod` | Multi-stage build + nginx |
| `docker-compose.yml` | `app` (dev) and `prod` (profile) services |
| `nginx.conf` | SPA fallback for production |

No backend is included; the app is static after build.
