# api-service

## Docker

Build only API image:

```bash
pnpm --filter grota-api-service docker:build
```

Run only API container:

```bash
pnpm --filter grota-api-service docker:run
```

Start full stack (API + Prometheus + Grafana):

```bash
cd apps/api-service
docker compose up -d --build
```

Default URLs:

- API: `http://localhost:8080`
- Actuator health: `http://localhost:8080/actuator/health`
- Prometheus: `http://localhost:9090`
- Grafana: `http://localhost:3000` (default: `admin` / `admin123`)

Stop stack:

```bash
docker compose down
```

`docker-compose.yml` does not create PostgreSQL. The API uses the datasource configured in `src/main/resources/application-prod.properties` unless `SPRING_DATASOURCE_*` is provided at runtime.

## Koyeb (Docker)

No Koyeb, use 3 services in the same app:

1. `api-service`: build from repository root `apps/api-service/Dockerfile`.
2. `prometheus`: build from `apps/api-service/monitoring/prometheus/Dockerfile`.
3. `grafana`: build from `apps/api-service/monitoring/grafana/Dockerfile`.

Recommended service ports:

- `api-service`: `8080`
- `prometheus`: `9090`
- `grafana`: `3000`

Required env vars:

- `api-service`: existing app env vars (`SPRING_DATASOURCE_*`, `JWT_SECRET_KEY`, etc).
- `prometheus`: `PROMETHEUS_TARGET=api-service:8080` (or your public API domain and port).
- `grafana`: `GF_SECURITY_ADMIN_USER`, `GF_SECURITY_ADMIN_PASSWORD`.

When using different Koyeb service names, update:

- `PROMETHEUS_TARGET` (Prometheus scrape target).
- `monitoring/grafana/provisioning/datasources/datasource.yml` (`url` for Prometheus).
