# Remora

Open-source, self-hosted **Termius** analogue.

- **Desktop:** macOS & Windows (Linux included from upstream) — Tauri + Rust SSH core
- **Cloud sync:** your Docker stack, zero-knowledge ciphertext
- **Web:** vault UI + optional SSH gateway
- **No billing.** Forever free to self-host.

Fork basis: [UniSSH](https://github.com/goduni/unissh) — see [FORK.md](FORK.md).

| Doc | Purpose |
|-----|---------|
| [docs/parity.md](docs/parity.md) | Feature matrix vs Termius |
| [docs/self-host.md](docs/self-host.md) | Deploy, backup, restore |
| [docs/web-gateway.md](docs/web-gateway.md) | Web trust model |
| [docs/import-termius.md](docs/import-termius.md) | Migration |
| [docs/RELEASE.md](docs/RELEASE.md) | Cut a release |

```bash
cp deploy/.env.example .env
docker compose up -d --build
# optional web SSH:
# add REMORA_GATEWAY_TOKEN to .env, then:
docker compose --profile gateway up -d --build
```
