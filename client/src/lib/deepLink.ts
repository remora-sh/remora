/** Remora desktop deep-link helpers (`remora://…`). */

export function hostDeepLink(hostId: string): string {
  return `remora://host/${encodeURIComponent(hostId)}`;
}

export function parseRemoraDeepLink(url: string): { kind: "host"; id: string } | null {
  try {
    const u = new URL(url);
    if (u.protocol !== "remora:") return null;
    if (u.hostname === "host" || u.pathname.startsWith("//host/")) {
      const id = u.hostname === "host" ? u.pathname.replace(/^\//, "") : u.pathname.replace(/^\/\/host\//, "");
      if (!id) return null;
      return { kind: "host", id: decodeURIComponent(id) };
    }
    // remora://host/<id> often parses as host=host, path=/<id>
    if (u.host === "host") {
      const id = u.pathname.replace(/^\//, "");
      if (id) return { kind: "host", id: decodeURIComponent(id) };
    }
    return null;
  } catch {
    return null;
  }
}
