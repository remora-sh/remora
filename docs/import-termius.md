# Importing from Termius

Remora aims to import what Termius can export. Formats vary by Termius version.

## Supported today (via UniSSH/Remora desktop)

| Source | Status |
|--------|--------|
| `~/.ssh/config` | **done** |
| `~/.ssh/known_hosts` | **done** |
| PuTTY `.reg` sessions | **done** |
| Encrypted Remora/UniSSH vault backup (`.unisshbak`) | **done** |
| Termius JSON / CSV export | **partial** — parser scaffold |

## Termius export scaffold

Desktop settings → Import will grow a **Termius** option. Intermediate format:

```json
{
  "format": "remora.termius-import.v1",
  "hosts": [
    {
      "label": "prod-api",
      "hostname": "api.example.com",
      "port": 22,
      "username": "deploy",
      "group": "production"
    }
  ],
  "snippets": [
    { "label": "disk", "body": "df -h" }
  ]
}
```

Place a normalized file at `~/Downloads/termius-export.json` and use:

```bash
# CLI helper (workspace member unissh CLI / remora alias)
cargo run -p unissh-cli -- import-termius ./termius-export.json
```

Until the CLI subcommand lands, convert manually into OpenSSH `Host` blocks and
use the existing OpenSSH import in the desktop client.

## Groups → Remora groups

Termius groups map to Remora nested host groups. Shared team vaults map to
Remora **spaces** after cloud sync is configured.
