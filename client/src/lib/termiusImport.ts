/**
 * Termius → Remora import scaffold.
 * See docs/import-termius.md.
 */

export type TermiusImportV1 = {
  format: "remora.termius-import.v1";
  hosts: Array<{
    label: string;
    hostname: string;
    port?: number;
    username?: string;
    group?: string;
  }>;
  snippets?: Array<{ label: string; body: string }>;
};

export type NormalizedHost = {
  label: string;
  host: string;
  port: number;
  username: string;
  group: string | null;
};

export type NormalizedSnippet = {
  label: string;
  body: string;
};

export function parseTermiusImport(raw: unknown): {
  hosts: NormalizedHost[];
  snippets: NormalizedSnippet[];
} {
  if (!raw || typeof raw !== "object") {
    throw new Error("import root must be an object");
  }
  const obj = raw as Record<string, unknown>;
  if (obj.format !== "remora.termius-import.v1") {
    throw new Error(`unsupported format: ${String(obj.format)}`);
  }
  const hostsIn = Array.isArray(obj.hosts) ? obj.hosts : [];
  const snippetsIn = Array.isArray(obj.snippets) ? obj.snippets : [];

  const hosts: NormalizedHost[] = hostsIn.map((h, i) => {
    if (!h || typeof h !== "object") throw new Error(`hosts[${i}] invalid`);
    const row = h as Record<string, unknown>;
    const hostname = String(row.hostname || "");
    if (!hostname) throw new Error(`hosts[${i}].hostname required`);
    return {
      label: String(row.label || hostname),
      host: hostname,
      port: Number(row.port || 22),
      username: String(row.username || ""),
      group: row.group ? String(row.group) : null,
    };
  });

  const snippets: NormalizedSnippet[] = snippetsIn.map((s, i) => {
    if (!s || typeof s !== "object") throw new Error(`snippets[${i}] invalid`);
    const row = s as Record<string, unknown>;
    return {
      label: String(row.label || `snippet-${i + 1}`),
      body: String(row.body || ""),
    };
  });

  return { hosts, snippets };
}

/** Convert normalized hosts into OpenSSH config text for the existing importer. */
export function toOpenSshConfig(hosts: NormalizedHost[]): string {
  return hosts
    .map((h) => {
      const lines = [`Host ${sanitizeHostAlias(h.label)}`, `  HostName ${h.host}`, `  Port ${h.port}`];
      if (h.username) lines.push(`  User ${h.username}`);
      return lines.join("\n");
    })
    .join("\n\n");
}

function sanitizeHostAlias(label: string): string {
  return label.replace(/[^\w.-]+/g, "-").replace(/^-+|-+$/g, "") || "imported-host";
}
