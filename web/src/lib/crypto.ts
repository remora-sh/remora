/**
 * Client-side vault unlock helpers for the web workspace.
 *
 * Full byte-compatible UniSSH/Remora crypto ships as wasm in `server-ui/crypto-wasm`.
 * Until that package is shared into `web/`, this module provides:
 *  - master-secret handling in memory only (never sent to the sync API)
 *  - a canary check hook for when wasm is linked
 *
 * Sync API calls still use account auth tokens; vault ciphertext stays opaque.
 */

export type UnlockState = {
  /** Opaque handle — never log or persist. */
  masterSecret: Uint8Array;
  unlockedAt: number;
};

let unlocked: UnlockState | null = null;

export function isUnlocked(): boolean {
  return unlocked !== null;
}

export function getMasterSecret(): Uint8Array | null {
  return unlocked?.masterSecret ?? null;
}

export function lockVault() {
  if (unlocked) {
    unlocked.masterSecret.fill(0);
    unlocked = null;
  }
}

/** Derive an in-memory secret from passphrase (placeholder KDF until wasm). */
export async function unlockWithPassphrase(passphrase: string): Promise<UnlockState> {
  const enc = new TextEncoder();
  const material = await crypto.subtle.importKey(
    "raw",
    enc.encode(passphrase),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: enc.encode("remora-web-v1"),
      iterations: 210_000,
      hash: "SHA-256",
    },
    material,
    256,
  );
  const masterSecret = new Uint8Array(bits);
  unlocked = { masterSecret, unlockedAt: Date.now() };
  return unlocked;
}

export async function sha256Hex(data: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(data));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
