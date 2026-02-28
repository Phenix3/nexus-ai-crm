import { getContacts, getOrgMembers, type ContactFilters } from "@/lib/actions/contacts";
import { getTags } from "@/lib/actions/tags";
import { ContactsTable } from "./_components/contacts-table";

export const metadata = { title: "Contacts — Nexus CRM" };

interface ContactsPageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function ContactsPage({ searchParams }: ContactsPageProps) {
  const params = await searchParams;

  const filters: ContactFilters = {
    q: params.q || undefined,
    tagId: params.tag || undefined,
    scoreMin: params.score_min !== undefined ? Number(params.score_min) : undefined,
    scoreMax: params.score_max !== undefined ? Number(params.score_max) : undefined,
    ownerId: params.owner || undefined,
    sort: (params.sort as ContactFilters["sort"]) || undefined,
    dir: (params.dir as ContactFilters["dir"]) || undefined,
  };

  const [contacts, tags, members] = await Promise.all([
    getContacts(filters),
    getTags(),
    getOrgMembers(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Contacts</h1>
        <p className="mt-1 text-sm text-zinc-500">Manage your prospects and customers.</p>
      </div>

      <ContactsTable contacts={contacts} tags={tags} members={members} activeFilters={filters} />
    </div>
  );
}
