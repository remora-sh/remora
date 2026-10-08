# Remora ← UniSSH

Remora is an open-source, self-hosted Termius analogue. It is a product fork of
[UniSSH](https://github.com/goduni/unissh) (MIT OR Apache-2.0).

## What we keep from upstream

- Shared Rust core (`unissh_*` crates): crypto, vault, SSH, SFTP, sync, agent
- Desktop client (Tauri 2 + React) and sync server (axum)
- Zero-knowledge ciphertext sync model
- Admin SPA (`server-ui`)

Internal crate and `UNISSH__*` config names stay for clean upstream merges.
User-facing product name, bundle id, images, and docs are **Remora**.

## What Remora adds

| Area | Remora contribution |
|------|---------------------|
| Brand | Remora product identity, `remora://` deep links |
| Web workspace | `web/` — vault UI in the browser (wasm unlock) |
| SSH gateway | `gateway/` — optional WebSocket→SSH for browser sessions |
| Self-host | Remora compose project name, ops docs, backup scripts |
| Parity tracking | `docs/parity.md` vs Termius |

## Upstream sync

```bash
git fetch upstream
git merge upstream/main   # or rebase; resolve brand conflicts carefully
```

Remote `upstream` → `https://github.com/goduni/unissh.git`.

## Trust model (short)

- **Desktop:** SSH is direct device→host. Sync server sees ciphertext only.
- **Web sessions:** require the optional gateway; the gateway operator can see
  live session bytes. Sync remains E2E. See `docs/web-gateway.md`.
