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

Start backend with Docker Compose (API only):

```bash
cd apps/api-service
docker compose up -d --build
```

`docker-compose.yml` does not create PostgreSQL. The API uses the datasource configured in `src/main/resources/application-prod.properties` unless `SPRING_DATASOURCE_*` is provided at runtime.

Stop stack:

```bash
docker compose down
```

Publish image (set full image reference first):

```bash
cd apps/api-service
IMAGE_REF=docker.io/<user>/grota-api-service:latest npm run docker:publish
```
