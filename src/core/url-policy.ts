/** Hostnames and literal addresses that must never be requested by profilectl. */

const BLOCKED_HOSTNAMES = new Set(["localhost", "metadata.google.internal"]);

function parseIpv4(hostname: string): number[] | undefined {
  const match = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(hostname);
  if (!match) return undefined;
  const octets = match.slice(1).map(Number);
  if (octets.some((octet) => octet > 255)) return undefined;
  return octets;
}

function isBlockedIpv4(octets: readonly number[]): boolean {
  const [a, b] = octets;
  if (a === undefined || b === undefined) return true;
  // 0.0.0.0/8 — "this" network / unspecified
  if (a === 0) return true;
  // 10.0.0.0/8 — RFC1918
  if (a === 10) return true;
  // 127.0.0.0/8 — loopback
  if (a === 127) return true;
  // 169.254.0.0/16 — link-local / cloud metadata (incl. 169.254.169.254)
  if (a === 169 && b === 254) return true;
  // 172.16.0.0/12 — RFC1918
  if (a === 172 && b >= 16 && b <= 31) return true;
  // 192.168.0.0/16 — RFC1918
  if (a === 192 && b === 168) return true;
  return false;
}

function unwrapHostname(hostname: string): string {
  const trimmed = hostname.trim().toLowerCase().replace(/\.$/, "");
  // WHATWG URL keeps brackets around IPv6 literals in hostname.
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function expandIpv4MappedHextets(host: string): number[] | undefined {
  // Node may normalize ::ffff:127.0.0.1 to ::ffff:7f00:1
  const match = /^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/i.exec(host);
  if (!match || match[1] === undefined || match[2] === undefined)
    return undefined;
  const high = Number.parseInt(match[1], 16);
  const low = Number.parseInt(match[2], 16);
  if (!Number.isFinite(high) || !Number.isFinite(low)) return undefined;
  return [(high >>> 8) & 0xff, high & 0xff, (low >>> 8) & 0xff, low & 0xff];
}

function mappedIpv4FromPrefix(host: string): number[] | undefined {
  if (!host.startsWith("::ffff:")) return undefined;
  const suffix = host.slice("::ffff:".length);
  return parseIpv4(suffix) ?? expandIpv4MappedHextets(host);
}

function firstHextet(host: string): number | undefined {
  const head = host.split(":", 1)[0];
  if (head === undefined || head === "") return undefined;
  const value = Number.parseInt(head, 16);
  return Number.isFinite(value) ? value : undefined;
}

function isBlockedIpv6(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (host === "::1" || host === "0:0:0:0:0:0:0:1") return true;

  const mapped = mappedIpv4FromPrefix(host);
  if (mapped !== undefined) return isBlockedIpv4(mapped);

  const hextet = firstHextet(host);
  if (hextet === undefined) {
    // Leading "::" forms such as ::ffff:... already handled; bare "::" is unspecified.
    return host === "::";
  }

  // Unique-local fc00::/7
  if ((hextet & 0xfe00) === 0xfc00) return true;
  // Link-local fe80::/10
  if ((hextet & 0xffc0) === 0xfe80) return true;
  return false;
}

/**
 * Returns true when the hostname is a non-public address that must not be
 * fetched (RFC1918, loopback, link-local/metadata, localhost).
 */
export function isBlockedHostname(hostname: string): boolean {
  const host = unwrapHostname(hostname);
  if (!host) return true;
  if (BLOCKED_HOSTNAMES.has(host)) return true;
  if (host.endsWith(".localhost") || host.endsWith(".local")) return true;

  const ipv4 = parseIpv4(host);
  if (ipv4 !== undefined) return isBlockedIpv4(ipv4);

  // Bracketless IPv6 as produced by URL.hostname (after unwrap)
  if (host.includes(":")) return isBlockedIpv6(host);

  return false;
}

export type PublicHttpUrlReason =
  | "invalid_url"
  | "unsupported_protocol"
  | "blocked_host"
  | "credentials_forbidden";

export interface PublicHttpUrlResult {
  readonly ok: boolean;
  readonly reason?: PublicHttpUrlReason;
  readonly href?: string;
}

/**
 * Validate that a URL is http(s) and targets a public host.
 * Does not perform DNS resolution; literal IPs and special hostnames are checked.
 */
export function evaluatePublicHttpUrl(value: string): PublicHttpUrlResult {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return { ok: false, reason: "invalid_url" };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { ok: false, reason: "unsupported_protocol" };
  }

  if (parsed.username || parsed.password) {
    return { ok: false, reason: "credentials_forbidden" };
  }

  if (isBlockedHostname(parsed.hostname)) {
    return { ok: false, reason: "blocked_host" };
  }

  return { ok: true, href: parsed.href };
}

export function isPublicHttpUrl(value: string): boolean {
  return evaluatePublicHttpUrl(value).ok;
}

export function assertPublicHttpUrl(value: string): string {
  const result = evaluatePublicHttpUrl(value);
  if (!result.ok || result.href === undefined) {
    const detail =
      result.reason === "blocked_host"
        ? "non-public or special-use host"
        : result.reason === "credentials_forbidden"
          ? "userinfo is not allowed"
          : result.reason === "unsupported_protocol"
            ? "only http(s) URLs are allowed"
            : "invalid URL";
    throw new Error(`${value}: ${detail}`);
  }
  return result.href;
}
