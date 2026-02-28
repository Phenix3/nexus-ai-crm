import { getContacts } from "@/lib/actions/contacts";
import { ContactsTable } from "./_components/contacts-table";

export const metadata = { title: "Contacts — Nexus CRM" };

export default async function ContactsPage() {
  const contacts = await getContacts();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Contacts</h1>
        <p className="mt-1 text-sm text-zinc-500">Manage your prospects and customers.</p>
      </div>

      <ContactsTable contacts={contacts} />
    </div>
  );
}
