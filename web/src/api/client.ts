import { lsGet, lsSet } from "../lib/storage";

export type ServerInfo = {
  name?: string;
  version?: string;
  claimed?: boolean;
};

function apiBase(): string {
  const fromLs = lsGet("apiBase");
  if (fromLs) return fromLs.replace(/\/$/, "");
  return "";
}

export async function fetchServerInfo(): Promise<ServerInfo> {
  const res = await fetch(`${apiBase()}/v1/server-info`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`server-info ${res.status}`);
  }
  return res.json();
}

export async function healthz(): Promise<boolean> {
  try {
    const res = await fetch(`${apiBase()}/healthz`);
    return res.ok;
  } catch {
    return false;
  }
}

/** Host list is ciphertext on the server; web shows local cache after unlock. */
export type HostCard = {
  id: string;
  label: string;
  host: string;
  port: number;
  username: string;
  tags: string[];
};

const DEMO_HOSTS: HostCard[] = [
  {
    id: "demo-1",
    label: "bastion.prod",
    host: "bastion.example.com",
    port: 22,
    username: "deploy",
    tags: ["prod", "jump"],
  },
  {
    id: "demo-2",
    label: "db-replica",
    host: "10.0.4.12",
    port: 22,
    username: "ubuntu",
    tags: ["db"],
  },
];

export function loadLocalHosts(): HostCard[] {
  const raw = lsGet("hostsCache");
  if (!raw) return DEMO_HOSTS;
  try {
    return JSON.parse(raw) as HostCard[];
  } catch {
    return DEMO_HOSTS;
  }
}

export function saveLocalHosts(hosts: HostCard[]) {
  lsSet("hostsCache", JSON.stringify(hosts));
}

export function desktopDeepLink(hostId: string): string {
  return `remora://host/${encodeURIComponent(hostId)}`;
}
