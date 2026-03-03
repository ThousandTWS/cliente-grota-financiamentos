FROM grafana/grafana:11.2.2

USER root
COPY --chown=472:0 provisioning /etc/grafana/provisioning
COPY --chown=472:0 dashboards /var/lib/grafana/dashboards

USER 472
EXPOSE 3000
