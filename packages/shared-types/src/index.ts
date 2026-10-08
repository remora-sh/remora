/** Shared Remora types (web ↔ future shared UI). */

export type HostSummary = {
  id: string;
  label: string;
  host: string;
  port: number;
  username: string;
  tags: string[];
};

export type GatewayClientMsg =
  | {
      type: "connect";
      host: string;
      port: number;
      username: string;
      password?: string;
      private_key_pem?: string;
      term?: string;
      cols?: number;
      rows?: number;
    }
  | { type: "input"; data: string }
  | { type: "resize"; cols: number; rows: number }
  | { type: "ping" };

export type GatewayServerMsg =
  | { type: "ready"; session_id: string }
  | { type: "output"; data: string }
  | { type: "error"; message: string }
  | { type: "closed"; reason: string }
  | { type: "pong" };
