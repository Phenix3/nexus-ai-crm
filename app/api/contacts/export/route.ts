import { type NextRequest, NextResponse } from "next/server";
import { getContacts, type ContactFilters } from "@/lib/actions/contacts";

function escapeCsvField(value: string | null | undefined): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const scoreMinStr = searchParams.get("score_min");
  const scoreMaxStr = searchParams.get("score_max");

  const filters: ContactFilters = {
    q: searchParams.get("q") ?? undefined,
    tagId: searchParams.get("tag") ?? undefined,
    scoreMin: scoreMinStr !== null ? Number(scoreMinStr) : undefined,
    scoreMax: scoreMaxStr !== null ? Number(scoreMaxStr) : undefined,
    ownerId: searchParams.get("owner") ?? undefined,
    sort: (searchParams.get("sort") as ContactFilters["sort"]) ?? undefined,
    dir: (searchParams.get("dir") as ContactFilters["dir"]) ?? undefined,
  };

  let contacts;
  try {
    contacts = await getContacts(filters);
  } catch {
    return NextResponse.json({ error: "Failed to fetch contacts" }, { status: 500 });
  }

  const today = new Date().toISOString().slice(0, 10);
  const headers = [
    "First name",
    "Last name",
    "Email",
    "Phone",
    "Company",
    "Job title",
    "LinkedIn",
    "Score",
    "Tags",
    "Created",
  ];

  const rows = contacts.map((c) => [
    escapeCsvField(c.first_name),
    escapeCsvField(c.last_name),
    escapeCsvField(c.email),
    escapeCsvField(c.phone),
    escapeCsvField(c.company),
    escapeCsvField(c.job_title),
    escapeCsvField(c.linkedin_url),
    String(c.score),
    escapeCsvField(c.tags?.map((t) => t.name).join("; ") ?? ""),
    escapeCsvField(c.created_at.slice(0, 10)),
  ]);

  const csv =
    "\uFEFF" + // BOM for Excel UTF-8 detection
    [headers.join(","), ...rows.map((row) => row.join(","))].join("\r\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="contacts-${today}.csv"`,
    },
  });
}
