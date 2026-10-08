import { FormEvent, useMemo, useState } from "react";
import { desktopDeepLink } from "./api/client";
import { GatewayTerminal } from "./components/Terminal";
import { useStore } from "./store";

export default function App() {
  const unlocked = useStore((s) => s.unlocked);
  const tab = useStore((s) => s.tab);
  const hosts = useStore((s) => s.hosts);
  const notice = useStore((s) => s.notice);
  const unlock = useStore((s) => s.unlock);
  const lock = useStore((s) => s.lock);
  const setTab = useStore((s) => s.setTab);
  const apiBase = useStore((s) => s.apiBase);
  const gatewayUrl = useStore((s) => s.gatewayUrl);
  const gatewayToken = useStore((s) => s.gatewayToken);
  const setApiBase = useStore((s) => s.setApiBase);
  const setGatewayUrl = useStore((s) => s.setGatewayUrl);
  const setGatewayToken = useStore((s) => s.setGatewayToken);

  const [pass, setPass] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const activeHost = useMemo(() => {
    if (tab.kind !== "terminal") return null;
    return hosts.find((h) => h.id === tab.hostId) ?? null;
  }, [tab, hosts]);

  async function onUnlock(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await unlock(pass);
      setPass("");
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : String(ex));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="shell">
      <aside className="rail">
        <div className="brand">
          <div className="mark" aria-hidden />
          <div>
            <div className="name">Remora</div>
            <div className="tag">self-hosted SSH</div>
          </div>
        </div>
        <nav>
          <NavBtn active={tab.kind === "home"} onClick={() => setTab({ kind: "home" })}>
            Home
          </NavBtn>
          <NavBtn
            active={tab.kind === "hosts" || tab.kind === "terminal"}
            onClick={() => setTab({ kind: "hosts" })}
            disabled={!unlocked}
          >
            Hosts
          </NavBtn>
          <NavBtn active={tab.kind === "settings"} onClick={() => setTab({ kind: "settings" })}>
            Settings
          </NavBtn>
        </nav>
        <div className="rail-foot">
          {unlocked ? (
            <button type="button" className="btn ghost block" onClick={lock}>
              Lock vault
            </button>
          ) : (
            <span className="muted">Vault locked</span>
          )}
        </div>
      </aside>

      <main className="main">
        {notice && <div className="banner">{notice}</div>}

        {tab.kind === "home" && (
          <section className="panel">
            <h1>Attach to your fleet</h1>
            <p className="lede">
              Remora keeps hosts, keys, and snippets in an end-to-end encrypted vault. Sync through
              your own server. Desktop talks SSH directly; the optional web gateway is for browser
              terminals only.
            </p>
            {!unlocked ? (
              <form className="card unlock" onSubmit={onUnlock}>
                <label>
                  Master passphrase
                  <input
                    type="password"
                    autoComplete="current-password"
                    value={pass}
                    onChange={(e) => setPass(e.target.value)}
                    required
                  />
                </label>
                {err && <div className="error">{err}</div>}
                <button className="btn primary" type="submit" disabled={busy}>
                  {busy ? "Unlocking…" : "Unlock vault"}
                </button>
                <p className="hint">
                  Passphrase never leaves this browser. Full wasm crypto lands via shared{" "}
                  <code>crypto-wasm</code>; this build derives a local unlock secret for UI flow.
                </p>
              </form>
            ) : (
              <div className="card">
                <p>Vault unlocked. Browse hosts or open a session.</p>
                <button type="button" className="btn primary" onClick={() => setTab({ kind: "hosts" })}>
                  Open hosts
                </button>
              </div>
            )}
          </section>
        )}

        {tab.kind === "hosts" && unlocked && (
          <section className="panel">
            <h1>Hosts</h1>
            <p className="lede">Local cache after unlock. Ciphertext syncs via your Remora server.</p>
            <div className="host-grid">
              {hosts.map((h) => (
                <article key={h.id} className="host-card">
                  <header>
                    <strong>{h.label}</strong>
                    <span className="mono">
                      {h.username}@{h.host}:{h.port}
                    </span>
                  </header>
                  <div className="tags">
                    {h.tags.map((t) => (
                      <span key={t}>{t}</span>
                    ))}
                  </div>
                  <div className="actions">
                    <button
                      type="button"
                      className="btn primary"
                      onClick={() => setTab({ kind: "terminal", hostId: h.id })}
                    >
                      Web terminal
                    </button>
                    <a className="btn ghost" href={desktopDeepLink(h.id)}>
                      Desktop
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {tab.kind === "terminal" && activeHost && (
          <section className="panel fill">
            <GatewayTerminal host={activeHost} onClose={() => setTab({ kind: "hosts" })} />
          </section>
        )}

        {tab.kind === "settings" && (
          <section className="panel">
            <h1>Settings</h1>
            <div className="card form">
              <label>
                Sync API base (empty = same origin)
                <input
                  value={apiBase}
                  onChange={(e) => setApiBase(e.target.value)}
                  placeholder="https://remora.example.com"
                />
              </label>
              <label>
                Gateway URL prefix
                <input
                  value={gatewayUrl}
                  onChange={(e) => setGatewayUrl(e.target.value)}
                  placeholder="/gateway"
                />
              </label>
              <label>
                Gateway session token
                <input
                  type="password"
                  value={gatewayToken}
                  onChange={(e) => setGatewayToken(e.target.value)}
                  placeholder="REMORA_GATEWAY_TOKEN"
                />
              </label>
              <p className="hint">
                Enable gateway with <code>docker compose --profile gateway up</code>. See{" "}
                <code>docs/web-gateway.md</code>.
              </p>
            </div>
          </section>
        )}
      </main>

      <style>{css}</style>
    </div>
  );
}

function NavBtn({
  children,
  active,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className={`nav ${active ? "active" : ""}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

const css = `
.shell { display: grid; grid-template-columns: 240px 1fr; height: 100%; }
.rail { border-right: 1px solid var(--line); background: rgba(10,16,28,.72); backdrop-filter: blur(10px);
  padding: 20px 16px; display: flex; flex-direction: column; gap: 24px; }
.brand { display: flex; gap: 12px; align-items: center; }
.mark { width: 36px; height: 36px; border-radius: 10px;
  background: linear-gradient(145deg, var(--accent), #4a7dff 70%);
  box-shadow: 0 8px 24px rgba(61,214,198,.25); }
.name { font-weight: 700; letter-spacing: -.02em; }
.tag { font-size: 12px; color: var(--muted); }
nav { display: flex; flex-direction: column; gap: 6px; }
.nav { text-align: left; border: 0; background: transparent; color: var(--muted); padding: 10px 12px; border-radius: 8px; }
.nav:hover:not(:disabled) { background: var(--bg2); color: var(--text); }
.nav.active { background: var(--bg2); color: var(--text); }
.nav:disabled { opacity: .4; cursor: not-allowed; }
.rail-foot { margin-top: auto; }
.main { padding: 28px 32px; overflow: auto; }
.panel h1 { margin: 0 0 8px; font-size: 28px; letter-spacing: -.03em; }
.lede { color: var(--muted); max-width: 58ch; line-height: 1.5; }
.card { background: rgba(18,26,43,.9); border: 1px solid var(--line); border-radius: var(--radius); padding: 20px; max-width: 420px; }
.unlock, .form { display: flex; flex-direction: column; gap: 14px; }
label { display: flex; flex-direction: column; gap: 6px; font-size: 13px; color: var(--muted); }
input { background: var(--bg0); border: 1px solid var(--line); border-radius: 8px; padding: 10px 12px; color: var(--text); }
.btn { border-radius: 8px; border: 1px solid var(--line); padding: 10px 14px; background: var(--bg2); color: var(--text); text-decoration: none; display: inline-flex; align-items: center; justify-content: center; }
.btn.primary { background: linear-gradient(180deg, var(--accent), var(--accent-dim)); color: #041016; border: 0; font-weight: 600; }
.btn.ghost { background: transparent; }
.btn.block { width: 100%; }
.hint, .muted { color: var(--muted); font-size: 12px; line-height: 1.45; }
.error { color: var(--danger); font-size: 13px; }
.host-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 14px; margin-top: 18px; }
.host-card { background: rgba(18,26,43,.9); border: 1px solid var(--line); border-radius: var(--radius); padding: 16px; display: flex; flex-direction: column; gap: 12px; }
.host-card header { display: flex; flex-direction: column; gap: 4px; }
.mono { font-family: var(--mono); font-size: 12px; color: var(--muted); }
.tags { display: flex; flex-wrap: wrap; gap: 6px; }
.tags span { font-size: 11px; padding: 3px 8px; border-radius: 999px; border: 1px solid var(--line); color: var(--muted); }
.actions { display: flex; gap: 8px; }
.panel.fill { height: calc(100% - 8px); display: flex; flex-direction: column; }
.banner { background: #3a2a10; border: 1px solid #6a5220; color: var(--warn); padding: 10px 12px; border-radius: 8px; margin-bottom: 16px; }
@media (max-width: 800px) {
  .shell { grid-template-columns: 1fr; }
  .rail { border-right: 0; border-bottom: 1px solid var(--line); }
}
`;
