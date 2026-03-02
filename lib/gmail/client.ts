/**
 * Gmail API client — raw fetch, no googleapis package.
 */

const GMAIL_BASE = "https://www.googleapis.com/gmail/v1/users/me";

// ── Types ─────────────────────────────────────────────────────────────────────

export type GmailMessage = {
  id: string;
  threadId: string;
};

export type GmailMessageDetail = {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  payload: GmailPayload;
  internalDate: string; // unix ms as string
};

type GmailPayload = {
  partId?: string;
  mimeType: string;
  headers: { name: string; value: string }[];
  body?: { size: number; data?: string };
  parts?: GmailPayload[];
};

export type ParsedEmail = {
  id: string;
  threadId: string;
  subject: string | null;
  from: string | null;
  to: string | null;
  date: Date;
  textPlain: string | null;
  textHtml: string | null;
  direction?: "inbound" | "outbound";
};

// ── Helpers ───────────────────────────────────────────────────────────────────

async function gmailFetch<T>(accessToken: string, path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${GMAIL_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gmail API error ${res.status}: ${text}`);
  }

  return res.json() as Promise<T>;
}

function getHeader(headers: { name: string; value: string }[], name: string): string | null {
  return headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? null;
}

function base64Decode(data: string): string {
  // Gmail uses URL-safe base64
  const standard = data.replace(/-/g, "+").replace(/_/g, "/");
  try {
    return Buffer.from(standard, "base64").toString("utf-8");
  } catch {
    return "";
  }
}

export function parseEmailBody(payload: GmailPayload): {
  textPlain: string | null;
  textHtml: string | null;
} {
  let textPlain: string | null = null;
  let textHtml: string | null = null;

  function extract(part: GmailPayload) {
    if (part.mimeType === "text/plain" && part.body?.data) {
      textPlain = base64Decode(part.body.data);
    } else if (part.mimeType === "text/html" && part.body?.data) {
      textHtml = base64Decode(part.body.data);
    }
    if (part.parts) {
      for (const p of part.parts) {
        extract(p);
      }
    }
  }

  extract(payload);
  return { textPlain, textHtml };
}

// ── API methods ───────────────────────────────────────────────────────────────

export async function listMessages(
  accessToken: string,
  query: string,
  maxResults = 50
): Promise<GmailMessage[]> {
  const params = new URLSearchParams({ q: query, maxResults: String(maxResults) });
  const data = await gmailFetch<{ messages?: GmailMessage[] }>(
    accessToken,
    `/messages?${params.toString()}`
  );
  return data.messages ?? [];
}

export async function getMessage(
  accessToken: string,
  messageId: string
): Promise<GmailMessageDetail> {
  return gmailFetch<GmailMessageDetail>(accessToken, `/messages/${messageId}?format=full`);
}

export async function parseMessage(detail: GmailMessageDetail): Promise<ParsedEmail> {
  const headers = detail.payload.headers;
  const { textPlain, textHtml } = parseEmailBody(detail.payload);

  return {
    id: detail.id,
    threadId: detail.threadId,
    subject: getHeader(headers, "Subject"),
    from: getHeader(headers, "From"),
    to: getHeader(headers, "To"),
    date: new Date(parseInt(detail.internalDate)),
    textPlain,
    textHtml,
  };
}

export async function sendMessage(accessToken: string, raw: string): Promise<{ id: string }> {
  return gmailFetch<{ id: string }>(accessToken, "/messages/send", {
    method: "POST",
    body: JSON.stringify({ raw }),
  });
}

/**
 * Encode a plain-text email as RFC 2822 base64url for Gmail send API.
 */
export function encodeEmail(opts: {
  to: string;
  from: string;
  subject: string;
  body: string;
  htmlBody?: string;
  replyTo?: string;
}): string {
  const boundary = `nexus_${Date.now()}`;
  const lines = [
    `From: ${opts.from}`,
    `To: ${opts.to}`,
    `Subject: ${opts.subject}`,
    ...(opts.replyTo ? [`Reply-To: ${opts.replyTo}`] : []),
    `MIME-Version: 1.0`,
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    `Content-Type: text/plain; charset="UTF-8"`,
    "",
    opts.body,
    "",
    ...(opts.htmlBody
      ? [`--${boundary}`, `Content-Type: text/html; charset="UTF-8"`, "", opts.htmlBody, ""]
      : []),
    `--${boundary}--`,
  ];

  const raw = lines.join("\r\n");
  return Buffer.from(raw).toString("base64url");
}
