# Remora release process (v0.1 → v1.0)

## Versioning

- Product version: `0.1.0` (Remora bootstrap). Upstream UniSSH crates may still
  report `0.5.x` until the next coordinated bump via `scripts/bump-version.py`.
- Server and gateway deploy independently; upgrade **server first**, then clients.

## Checklist before a tagged release

1. [ ] `docs/parity.md` updated
2. [ ] `cargo test -p remora-gateway` (and core crates as time allows)
3. [ ] `cd web && npm run typecheck && npm run build`
4. [ ] `cd client && npm run typecheck`
5. [ ] Docker: `docker compose config` and smoke `healthz`
6. [ ] Threat notes: `THREAT_MODEL.md` + `docs/web-gateway.md`
7. [ ] Unsigned desktop artifacts + checksums published (signing is optional until certs)
8. [ ] Auto-updater endpoints point at Remora releases (see `tauri.conf.json`)

## Code signing

Remora follows the UniSSH honesty model: unsigned builds are OK with documented
“open anyway” steps. Paid Apple/Windows certificates are a post-v1.0 ops choice.

## Security review

Prior to **v1.0**:

- Review gateway auth, allowlist, session teardown
- Confirm sync path never receives vault plaintext
- Fuzz JSON protocol on `/v1/session`
