# Remora ↔ Termius feature parity

Status legend: **done** (in UniSSH/Remora core) · **partial** · **planned** · **out of scope (v1)**

| Capability | Termius | Remora | Notes |
|------------|---------|--------|-------|
| Personal encrypted vault | yes | **done** | SQLCipher + E2E key hierarchy |
| Hosts / groups / nested groups | yes | **done** | |
| SSH keys / identities / passwords | yes | **done** | |
| Known hosts (TOFU) | yes | **done** | |
| SSH sessions (tabs, splits) | yes | **done** | Desktop |
| Jump hosts / ProxyJump | yes | **done** | |
| Agent forwarding | yes | **done** | Off by default; confirm per sig |
| SFTP dual-pane | yes | **done** | Desktop |
| Port forwarding L/R/SOCKS | yes | **done** | Desktop |
| Snippets | yes | **done** | |
| Snippet packages / startup snippets | yes | **partial** | Startup: done; packages: planned |
| Multi-host snippet / fleet exec | yes | **done** | Fleet exec + broadcast |
| Cloud sync (E2E) | paid | **done** | Self-hosted, free |
| Team vaults / sharing | paid | **done** | Spaces + vault roles |
| macOS / Windows clients | yes | **done** | (+ Linux from upstream) |
| Web vault management | limited | **planned→shipping** | `web/` |
| Web terminal | yes | **planned→shipping** | `gateway/` (trusted) |
| Web SFTP / tunnels | yes | **planned** | Phase 3b |
| Import OpenSSH config | yes | **done** | |
| Import PuTTY | yes | **done** | |
| Import Termius export | yes | **partial** | Parser stub in `client` / docs |
| Session logs / bookmarks | yes | **partial** | Encrypted asciicast; bookmarks planned |
| Telnet / Mosh | yes | **out of scope (v1)** | |
| Mobile iOS/Android | yes | **out of scope (v1)** | Present upstream; not Remora focus |
| Billing / SaaS plans | yes | **out of scope** | Forever free / self-host |
| Hosted vendor cloud | yes | **out of scope** | Optional demo instance only |

## Deep links

- Desktop: `remora://host/<id>`
- Legacy UniSSH schemes may appear in upstream code until fully aliased.
