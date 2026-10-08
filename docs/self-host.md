# Self-hosting Remora

## Quick start

```bash
cp deploy/.env.example .env
# set UNISSH_DOMAIN (and TLS directive). Env keys keep the UNISSH__ prefix for
# upstream server compatibility — see FORK.md.
docker compose up -d --build
```

Compose project name: **remora**. Images: `remora-server`, `remora-caddy`.

- Health: `https://$UNISSH_DOMAIN/healthz` and `/readyz`
- Admin UI: served by Caddy (server-ui SPA)
- Web workspace: enable when `web/` image is wired (see below)
- First user: claim instance with setup code from `docker compose logs server`

## Profiles

| Profile | Purpose |
|---------|---------|
| (default) | Sync server + Caddy + SQLite |
| `postgres` | Postgres instead of SQLite |
| `monitoring` | Prometheus |
| `gateway` | Optional WebSocket SSH gateway for browser terminals |

```bash
docker compose --profile gateway up -d --build
```

## Backup & restore

Ciphertext and metadata live in Docker volumes (SQLite file or Postgres).

```bash
# SQLite volume backup (example)
./deploy/scripts/backup.sh

# Restore
./deploy/scripts/restore.sh ./backups/remora-XXXX.tar.gz
```

Always test restore on a staging host. The server cannot decrypt vault payloads;
backups protect availability, not confidentiality of plaintext secrets.

## TLS

See `deploy/README.md` and `deploy/.env.example` for ACME, `tls internal`, and
certificate-file modes.

## Threat model

Full analysis: root `THREAT_MODEL.md` (upstream) + Remora web notes in
`docs/web-gateway.md`.
