import { useEffect, useRef } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";
import type { HostCard } from "../api/client";
import { useStore } from "../store";

type Props = {
  host: HostCard;
  onClose: () => void;
};

export function GatewayTerminal({ host, onClose }: Props) {
  const gatewayUrl = useStore((s) => s.gatewayUrl);
  const gatewayToken = useStore((s) => s.gatewayToken);
  const elRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!elRef.current) return;
    const term = new Terminal({
      cursorBlink: true,
      fontFamily: "IBM Plex Mono, ui-monospace, monospace",
      fontSize: 13,
      theme: {
        background: "#0b1220",
        foreground: "#e8eef9",
        cursor: "#3dd6c6",
      },
    });
    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(elRef.current);
    fit.fit();

    const setStatus = (msg: string) => {
      if (statusRef.current) statusRef.current.textContent = msg;
    };

    if (!gatewayToken) {
      setStatus("Set a gateway token in Settings. Or open in desktop: remora://host/" + host.id);
      term.writeln("\r\n\x1b[33mGateway token missing.\x1b[0m");
      term.writeln(`Deep link: remora://host/${host.id}`);
      return () => term.dispose();
    }

    const base = gatewayUrl.replace(/\/$/, "");
    const wsBase = base.startsWith("ws")
      ? base
      : `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}${base.startsWith("/") ? base : "/" + base}`;
    const url = `${wsBase}/v1/session?token=${encodeURIComponent(gatewayToken)}`;
    setStatus(`Connecting ${url}…`);

    const ws = new WebSocket(url);
    ws.onopen = () => {
      setStatus("WebSocket open — authenticating SSH…");
      ws.send(
        JSON.stringify({
          type: "connect",
          host: host.host,
          port: host.port,
          username: host.username,
          // Password/key must come from unlocked vault — prompt for demo:
          password: sessionStorage.getItem("remora.web.demoPassword") || undefined,
          term: "xterm-256color",
          cols: term.cols,
          rows: term.rows,
        }),
      );
    };
    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(String(ev.data));
        if (msg.type === "output") term.write(msg.data);
        else if (msg.type === "ready") setStatus(`Session ${msg.session_id}`);
        else if (msg.type === "error") {
          setStatus(msg.message);
          term.writeln(`\r\n\x1b[31m${msg.message}\x1b[0m`);
        } else if (msg.type === "closed") {
          setStatus(msg.reason);
          term.writeln(`\r\n\x1b[33m[${msg.reason}]\x1b[0m`);
        }
      } catch {
        term.write(String(ev.data));
      }
    };
    ws.onerror = () => setStatus("WebSocket error (is gateway running?)");
    ws.onclose = () => setStatus("Disconnected");

    term.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "input", data }));
      }
    });

    const onResize = () => {
      fit.fit();
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "resize", cols: term.cols, rows: term.rows }));
      }
    };
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      ws.close();
      term.dispose();
    };
  }, [host, gatewayToken, gatewayUrl]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: 8 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div>
          <strong>{host.label}</strong>{" "}
          <span style={{ color: "var(--muted)", fontFamily: "var(--mono)", fontSize: 13 }}>
            {host.username}@{host.host}:{host.port}
          </span>
        </div>
        <button type="button" className="btn ghost" onClick={onClose}>
          Close
        </button>
      </div>
      <div ref={statusRef} style={{ color: "var(--warn)", fontSize: 12 }} />
      <div
        ref={elRef}
        style={{
          flex: 1,
          minHeight: 320,
          border: "1px solid var(--line)",
          borderRadius: "var(--radius)",
          overflow: "hidden",
          background: "#0b1220",
        }}
      />
      <p style={{ margin: 0, color: "var(--muted)", fontSize: 12 }}>
        Web SSH trusts the gateway process. Prefer desktop for high-security hosts.{" "}
        <a href={`remora://host/${host.id}`}>Open in Remora desktop</a>
      </p>
    </div>
  );
}
