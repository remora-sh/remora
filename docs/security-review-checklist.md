# Remora security review checklist (pre-v1.0)

## Sync server (zero-knowledge path)

- [ ] Vault payloads never logged in plaintext
- [ ] Setup-code / ops-token rotation documented and tested
- [ ] TLS required in production compose
- [ ] Rate limits on auth endpoints
- [ ] Audit hash-chain append-only behaviour

## Desktop client

- [ ] Private keys never cross FFI to UI (except explicit export)
- [ ] Agent forwarding off by default; per-signature confirm
- [ ] Host-key mismatch always surfaced
- [ ] Auto-lock clears secrets from memory

## Web + gateway (trusted path)

- [ ] Gateway disabled by default (compose profile)
- [ ] Token ≥16 chars enforced
- [ ] Host allowlist deny-by-default when empty
- [ ] No agent forwarding through gateway
- [ ] Session teardown on WS close / token revoke
- [ ] UI warning that web SSH trusts the gateway operator
- [ ] Deep link `remora://` does not embed secrets

## Supply chain

- [ ] `cargo deny` / Dependabot green
- [ ] Release checksums published
- [ ] Updater pubkey rotation plan (see UniSSH/Remora unsigned model)

Owner: Remora maintainers. Re-run before every `v1.*` tag.
