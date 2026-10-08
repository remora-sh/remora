# Web client & SSH gateway

## Why a gateway exists

Browsers cannot open raw TCP SSH sockets. A web terminal therefore needs a
relay. Remora isolates that relay as an **optional** service: `gateway/`.

```
Browser (web/) --WSS--> gateway --SSH--> host
Browser (web/) --HTTPS--> sync server   (ciphertext vault only)
```

## Trust boundary

| Path | Trust |
|------|-------|
| Vault sync | Zero-knowledge. Server stores ciphertext. |
| Web SSH via gateway | **Trusted gateway.** Operators of the gateway process can observe live session I/O and credentials used for that session. |

Disable the gateway (default) if you only want desktop clients. Without it, the
web app still unlocks and manages the vault, then deep-links to desktop:
`remora://host/...`.

## Hardening checklist

- Compose profile `gateway` off unless needed
- TLS termination in front of WSS
- Short-lived session tokens bound to account + device
- Host allowlist / deny by default for destinations
- No agent forwarding through gateway (v1)
- Audit every session start/end
- Revoke device → kill active gateway sessions

## SFTP / tunnels in the browser

Deferred to phase 3b. Desktop remains the supported path for file transfer and
port forwards.
