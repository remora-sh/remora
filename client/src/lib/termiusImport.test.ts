import { describe, expect, it } from "vitest";
import { parseTermiusImport, toOpenSshConfig } from "./termiusImport";

describe("parseTermiusImport", () => {
  it("parses v1 documents", () => {
    const { hosts, snippets } = parseTermiusImport({
      format: "remora.termius-import.v1",
      hosts: [{ label: "api", hostname: "api.example.com", port: 2222, username: "deploy", group: "prod" }],
      snippets: [{ label: "disk", body: "df -h" }],
    });
    expect(hosts).toHaveLength(1);
    expect(hosts[0].host).toBe("api.example.com");
    expect(hosts[0].port).toBe(2222);
    expect(snippets[0].body).toBe("df -h");
  });

  it("rejects unknown formats", () => {
    expect(() => parseTermiusImport({ format: "nope", hosts: [] })).toThrow(/unsupported/);
  });
});

describe("toOpenSshConfig", () => {
  it("emits Host blocks", () => {
    const text = toOpenSshConfig([
      { label: "Prod API", host: "api.example.com", port: 22, username: "ubuntu", group: null },
    ]);
    expect(text).toContain("Host Prod-API");
    expect(text).toContain("HostName api.example.com");
    expect(text).toContain("User ubuntu");
  });
});
