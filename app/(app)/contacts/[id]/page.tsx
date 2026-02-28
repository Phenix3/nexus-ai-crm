import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getContact } from "@/lib/actions/contacts";
import { getContactNotes } from "@/lib/actions/notes";
import { ContactInfoCard } from "./_components/contact-info-card";
import { NotesSection } from "./_components/notes-section";

interface ContactPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ContactPageProps) {
  const { id } = await params;
  const contact = await getContact(id);
  if (!contact) return { title: "Contact not found" };
  const name = [contact.first_name, contact.last_name].filter(Boolean).join(" ") || "Unnamed";
  return { title: `${name} — Nexus CRM` };
}

export default async function ContactPage({ params }: ContactPageProps) {
  const { id } = await params;

  const [contact, notes] = await Promise.all([getContact(id), getContactNotes(id)]);

  if (!contact) notFound();

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      {/* Breadcrumb */}
      <Link
        href="/contacts"
        className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700 w-fit"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to contacts
      </Link>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
        {/* Left column — contact info */}
        <ContactInfoCard contact={contact} />

        {/* Right column — notes + activities */}
        <div className="flex flex-col gap-6">
          <NotesSection contactId={contact.id} notes={notes} />
        </div>
      </div>
    </div>
  );
}
