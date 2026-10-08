import { create } from "zustand";
import type { HostCard } from "./api/client";
import { loadLocalHosts } from "./api/client";
import { isUnlocked, lockVault, unlockWithPassphrase } from "./lib/crypto";
import { lsGet, lsSet } from "./lib/storage";

type Tab =
  | { kind: "home" }
  | { kind: "hosts" }
  | { kind: "terminal"; hostId: string }
  | { kind: "settings" };

type State = {
  apiBase: string;
  gatewayToken: string;
  gatewayUrl: string;
  unlocked: boolean;
  hosts: HostCard[];
  tab: Tab;
  notice: string | null;
  setApiBase: (v: string) => void;
  setGatewayToken: (v: string) => void;
  setGatewayUrl: (v: string) => void;
  unlock: (passphrase: string) => Promise<void>;
  lock: () => void;
  setTab: (t: Tab) => void;
  setNotice: (n: string | null) => void;
};

export const useStore = create<State>((set) => ({
  apiBase: lsGet("apiBase", ""),
  gatewayToken: lsGet("gatewayToken", ""),
  gatewayUrl: lsGet("gatewayUrl", "/gateway"),
  unlocked: isUnlocked(),
  hosts: loadLocalHosts(),
  tab: { kind: "home" },
  notice: null,
  setApiBase: (v) => {
    lsSet("apiBase", v);
    set({ apiBase: v });
  },
  setGatewayToken: (v) => {
    lsSet("gatewayToken", v);
    set({ gatewayToken: v });
  },
  setGatewayUrl: (v) => {
    lsSet("gatewayUrl", v);
    set({ gatewayUrl: v });
  },
  unlock: async (passphrase) => {
    await unlockWithPassphrase(passphrase);
    set({ unlocked: true, hosts: loadLocalHosts(), tab: { kind: "hosts" } });
  },
  lock: () => {
    lockVault();
    set({ unlocked: false, tab: { kind: "home" } });
  },
  setTab: (t) => set({ tab: t }),
  setNotice: (n) => set({ notice: n }),
}));
