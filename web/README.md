# Remora Web Workspace

Browser UI for vault browsing and optional SSH via `remora-gateway`.

## Dev

```bash
cd web
npm install
npm run dev
```

Proxy defaults:

- `/v1` → sync server (`REMORA_API_PROXY`, default `http://127.0.0.1:8443`)
- `/gateway` → gateway WS (`REMORA_GATEWAY_PROXY`, default `http://127.0.0.1:7700`)

## Trust

Vault unlock secrets stay in the browser. Live SSH through the gateway is a
**trusted** path — see `docs/web-gateway.md`. Prefer the desktop app for
sensitive hosts (`remora://host/<id>`).
