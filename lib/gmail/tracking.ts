/**
 * Email tracking helpers.
 * - Generate HMAC-signed tokens for open/click tracking
 * - Inject tracking pixel + rewrite links in HTML emails
 */

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// ── HMAC signing ──────────────────────────────────────────────────────────────

async function getSigningKey(): Promise<CryptoKey> {
  const keyHex = process.env.ENCRYPTION_KEY;
  if (!keyHex || keyHex.length !== 64) {
    throw new Error("ENCRYPTION_KEY must be set");
  }

  const pairs = keyHex.match(/.{2}/g)!;
  const buf = new ArrayBuffer(pairs.length);
  const keyBytes = new Uint8Array(buf);
  pairs.forEach((b, i) => {
    keyBytes[i] = parseInt(b, 16);
  });
  return crypto.subtle.importKey("raw", keyBytes, { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
    "verify",
  ]);
}

async function sign(data: string): Promise<string> {
  const key = await getSigningKey();
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return Buffer.from(sig).toString("base64url");
}

async function verify(data: string, signature: string): Promise<boolean> {
  try {
    const key = await getSigningKey();
    const sigBytes = Buffer.from(signature, "base64url");
    return crypto.subtle.verify("HMAC", key, sigBytes, new TextEncoder().encode(data));
  } catch {
    return false;
  }
}

// ── Token format: base64url(JSON) + "." + HMAC ───────────────────────────────

export async function createOpenToken(activityId: string, contactId: string): Promise<string> {
  const payload = Buffer.from(JSON.stringify({ activityId, contactId })).toString("base64url");
  const sig = await sign(payload);
  return `${payload}.${sig}`;
}

export async function createClickToken(activityId: string, originalUrl: string): Promise<string> {
  const payload = Buffer.from(JSON.stringify({ activityId, originalUrl })).toString("base64url");
  const sig = await sign(payload);
  return `${payload}.${sig}`;
}

export async function verifyOpenToken(
  token: string
): Promise<{ activityId: string; contactId: string } | null> {
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  if (!(await verify(payload, sig))) return null;
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf-8")) as {
      activityId: string;
      contactId: string;
    };
  } catch {
    return null;
  }
}

export async function verifyClickToken(
  token: string
): Promise<{ activityId: string; originalUrl: string } | null> {
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  if (!(await verify(payload, sig))) return null;
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf-8")) as {
      activityId: string;
      originalUrl: string;
    };
  } catch {
    return null;
  }
}

// ── HTML injection ────────────────────────────────────────────────────────────

export async function injectTracking(
  html: string,
  activityId: string,
  contactId: string
): Promise<string> {
  // 1. Rewrite <a href="..."> links
  const clickRewritten = await rewriteLinks(html, activityId);

  // 2. Inject open-tracking pixel before </body>
  const openToken = await createOpenToken(activityId, contactId);
  const pixelUrl = `${APP_URL}/api/track/open/${encodeURIComponent(openToken)}`;
  const pixel = `<img src="${pixelUrl}" width="1" height="1" style="display:none" alt="" />`;

  return clickRewritten.replace(/<\/body>/i, `${pixel}</body>`);
}

async function rewriteLinks(html: string, activityId: string): Promise<string> {
  // Simple regex rewrite — good enough for CRM emails (not adversarial input)
  const linkRegex = /href="(https?:\/\/[^"]+)"/g;
  const matches = [...html.matchAll(linkRegex)];

  let result = html;
  for (const match of matches) {
    const originalUrl = match[1];
    const token = await createClickToken(activityId, originalUrl);
    const trackUrl = `${APP_URL}/api/track/click/${encodeURIComponent(token)}`;
    result = result.replace(match[0], `href="${trackUrl}"`);
  }

  return result;
}
