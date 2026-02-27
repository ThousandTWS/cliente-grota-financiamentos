# api-service

## Docker

Build image:

```bash
pnpm --filter grota-api-service docker:build
```

Run only the backend container:

```bash
pnpm --filter grota-api-service docker:run
```

Start full local stack (`api-service + postgres + redis`):

```bash
cd apps/api-service
cp .env.docker.example .env
docker compose up -d --build
```

Stop stack:

```bash
docker compose down
```

Publish image (set full image reference first):

```bash
cd apps/api-service
IMAGE_REF=docker.io/<user>/grota-api-service:latest npm run docker:publish
```
