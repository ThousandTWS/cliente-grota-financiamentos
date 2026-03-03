#!/bin/sh
set -eu

PROMETHEUS_TARGET="${PROMETHEUS_TARGET:-api-service:8080}"
SCRAPE_INTERVAL="${SCRAPE_INTERVAL:-15s}"

cat > /etc/prometheus/prometheus.yml <<EOF
global:
  scrape_interval: ${SCRAPE_INTERVAL}
  evaluation_interval: ${SCRAPE_INTERVAL}

scrape_configs:
  - job_name: api-service
    metrics_path: /actuator/prometheus
    static_configs:
      - targets:
          - ${PROMETHEUS_TARGET}
EOF

exec /bin/prometheus \
  --config.file=/etc/prometheus/prometheus.yml \
  --storage.tsdb.path=/prometheus \
  --web.enable-lifecycle
