import { describe, expect, it } from "vitest";
import {
  assertPublicHttpUrl,
  evaluatePublicHttpUrl,
  isBlockedHostname,
  isPublicHttpUrl,
} from "../src/core/url-policy.js";

describe("public host URL policy", () => {
  it("rejects loopback, RFC1918, link-local/metadata, and localhost", () => {
    const blocked = [
      "http://127.0.0.1/",
      "http://10.0.0.1/admin",
      "http://172.16.5.1/",
      "http://172.31.255.255/",
      "http://192.168.1.1/",
      "http://169.254.169.254/latest/meta-data/",
      "http://169.254.1.1/",
      "http://[::1]/",
      "http://localhost/secret",
      "https://localhost",
      "http://metadata.google.internal/",
      "http://foo.localhost/",
      "http://printer.local/",
    ];

    for (const url of blocked) {
      expect(isPublicHttpUrl(url), url).toBe(false);
      expect(evaluatePublicHttpUrl(url).reason, url).toBe("blocked_host");
      expect(() => assertPublicHttpUrl(url)).toThrow(/non-public|special-use/);
    }

    expect(isBlockedHostname("127.0.0.1")).toBe(true);
    expect(isBlockedHostname("169.254.169.254")).toBe(true);
    expect(isBlockedHostname("::1")).toBe(true);
    expect(isBlockedHostname("localhost")).toBe(true);
  });

  it("accepts normal public https hosts used by fixtures", () => {
    expect(isPublicHttpUrl("https://example.com")).toBe(true);
    expect(isPublicHttpUrl("https://github.com/octocat")).toBe(true);
    expect(assertPublicHttpUrl("https://example.com/path")).toBe(
      "https://example.com/path",
    );
    expect(isBlockedHostname("example.com")).toBe(false);
    expect(isBlockedHostname("github.com")).toBe(false);
  });

  it("rejects non-http schemes, credentials, and invalid URLs", () => {
    expect(evaluatePublicHttpUrl("mailto:octocat@example.com").reason).toBe(
      "unsupported_protocol",
    );
    expect(evaluatePublicHttpUrl("ftp://example.com").reason).toBe(
      "unsupported_protocol",
    );
    expect(evaluatePublicHttpUrl("https://user:pass@example.com").reason).toBe(
      "credentials_forbidden",
    );
    expect(evaluatePublicHttpUrl("not a url").reason).toBe("invalid_url");
  });

  it("treats IPv4-mapped IPv6 loopback and private ranges as blocked", () => {
    expect(isPublicHttpUrl("http://[::ffff:127.0.0.1]/")).toBe(false);
    expect(isPublicHttpUrl("http://[::ffff:10.1.2.3]/")).toBe(false);
    expect(isPublicHttpUrl("http://[::ffff:192.168.0.9]/")).toBe(false);
  });

  it("covers IPv6 ULA/link-local, public literals, and edge host forms", () => {
    expect(isPublicHttpUrl("http://[fc00::1]/")).toBe(false);
    expect(isPublicHttpUrl("http://[fd12:3456:789a::1]/")).toBe(false);
    expect(isPublicHttpUrl("http://[fe80::1]/")).toBe(false);
    expect(isPublicHttpUrl("http://[0:0:0:0:0:0:0:1]/")).toBe(false);
    expect(isPublicHttpUrl("http://[::]/")).toBe(false);
    expect(isPublicHttpUrl("http://[2001:4860:4860::8888]/")).toBe(true);
    expect(isBlockedHostname("8.8.8.8")).toBe(false);
    expect(isBlockedHostname("172.32.0.1")).toBe(false);
    expect(isBlockedHostname("0.0.0.0")).toBe(true);
    expect(isBlockedHostname("")).toBe(true);
    expect(isBlockedHostname("example.com.")).toBe(false);
    expect(isBlockedHostname("256.1.1.1")).toBe(false);
    expect(isBlockedHostname("::2")).toBe(false);
    expect(() => assertPublicHttpUrl("mailto:x@example.com")).toThrow(
      /only http\(s\)/,
    );
    expect(() => assertPublicHttpUrl("https://user:pass@example.com")).toThrow(
      /userinfo/,
    );
    expect(() => assertPublicHttpUrl("::::")).toThrow(/invalid URL/);
  });
});
