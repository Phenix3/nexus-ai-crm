"use client";

import { useActionState } from "react";
import { updateOrganization, type UpdateOrgState } from "@/lib/actions/update-organization";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const TIMEZONES = [
  "Europe/Paris",
  "Europe/London",
  "Europe/Berlin",
  "Europe/Madrid",
  "Europe/Rome",
  "Europe/Amsterdam",
  "Europe/Brussels",
  "Europe/Zurich",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Toronto",
  "America/Sao_Paulo",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Singapore",
  "Asia/Dubai",
  "Australia/Sydney",
  "Pacific/Auckland",
];

const CURRENCIES = [
  { code: "EUR", label: "Euro (€)" },
  { code: "USD", label: "US Dollar ($)" },
  { code: "GBP", label: "British Pound (£)" },
  { code: "CHF", label: "Swiss Franc (CHF)" },
  { code: "CAD", label: "Canadian Dollar (CA$)" },
  { code: "AUD", label: "Australian Dollar (A$)" },
  { code: "JPY", label: "Japanese Yen (¥)" },
  { code: "SEK", label: "Swedish Krona (SEK)" },
  { code: "NOK", label: "Norwegian Krone (NOK)" },
  { code: "DKK", label: "Danish Krone (DKK)" },
];

type Props = {
  defaultName: string;
  defaultTimezone: string;
  defaultCurrency: string;
};

const initialState: UpdateOrgState = {};

export function OrgSettingsForm({ defaultName, defaultTimezone, defaultCurrency }: Props) {
  const [state, action, isPending] = useActionState(updateOrganization, initialState);

  return (
    <form action={action} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Organisation name</Label>
        <Input id="name" name="name" defaultValue={defaultName} maxLength={100} />
        {state.fieldErrors?.name && (
          <p className="text-sm text-red-500">{state.fieldErrors.name[0]}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="timezone">Timezone</Label>
        <select
          id="timezone"
          name="timezone"
          defaultValue={defaultTimezone}
          className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
        >
          {TIMEZONES.map((tz) => (
            <option key={tz} value={tz}>
              {tz.replace("_", " ")}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="currency">Currency</Label>
        <select
          id="currency"
          name="currency"
          defaultValue={defaultCurrency}
          className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
        >
          {CURRENCIES.map(({ code, label }) => (
            <option key={code} value={code}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {state.error && <p className="text-sm text-red-500">{state.error}</p>}
      {state.success && <p className="text-sm text-emerald-600">{state.success}</p>}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
