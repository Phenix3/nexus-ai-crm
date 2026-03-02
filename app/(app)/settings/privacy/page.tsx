"use client";

import { useState, useTransition } from "react";
import { Download, Trash2, AlertTriangle, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { deleteAccount } from "@/lib/actions/account";
import { toast } from "sonner";

export default function PrivacySettingsPage() {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleExport() {
    window.location.href = "/api/account/export";
    toast.success("Export started — file will download shortly.");
  }

  function handleDeleteRequest() {
    setConfirmDelete(true);
  }

  function handleDeleteConfirm() {
    if (deleteInput !== "DELETE") {
      toast.error('Please type "DELETE" to confirm.');
      return;
    }
    startTransition(async () => {
      await deleteAccount();
    });
  }

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Privacy & Data</h2>
        <p className="text-sm text-zinc-500">Manage your personal data and account.</p>
      </div>

      <Separator />

      {/* Data export */}
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/40">
            <Download className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Export your data</p>
            <p className="text-xs text-zinc-500 mt-0.5">
              Download all your contacts, deals, activities, and notes as a JSON file.
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport} className="gap-1.5">
          <Download className="h-3.5 w-3.5" />
          Download my data
        </Button>
      </div>

      <Separator />

      {/* Data retention */}
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-50 dark:bg-zinc-800">
            <Shield className="h-4 w-4 text-zinc-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Data retention</p>
            <p className="text-xs text-zinc-500 mt-0.5">
              Your data is stored securely on Supabase (EU servers). Activity logs are retained for
              90 days. You can delete your account at any time.
            </p>
          </div>
        </div>
      </div>

      <Separator />

      {/* Delete account */}
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50 dark:bg-red-950/40">
            <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Delete account</p>
            <p className="text-xs text-zinc-500 mt-0.5">
              Permanently remove your account and all associated data. This action cannot be undone.
            </p>
          </div>
        </div>

        {!confirmDelete ? (
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-red-500 border-red-200 hover:bg-red-50 hover:border-red-300 dark:border-red-900 dark:hover:bg-red-950/30"
            onClick={handleDeleteRequest}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete my account
          </Button>
        ) : (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 space-y-3 dark:border-red-900/60 dark:bg-red-950/20">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <p className="text-sm font-medium">This will permanently delete all your data.</p>
            </div>
            <p className="text-xs text-red-500 dark:text-red-400">
              Type <strong>DELETE</strong> to confirm:
            </p>
            <input
              type="text"
              value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value)}
              placeholder="DELETE"
              autoFocus
              className="w-full rounded-lg border border-red-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-red-300 focus:outline-none focus:ring-2 focus:ring-red-400/30 dark:bg-zinc-900 dark:border-red-900 dark:text-zinc-50"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="destructive"
                disabled={deleteInput !== "DELETE" || isPending}
                onClick={handleDeleteConfirm}
                className="gap-1.5"
              >
                <Trash2 className="h-3.5 w-3.5" />
                {isPending ? "Deleting…" : "Permanently delete"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setConfirmDelete(false);
                  setDeleteInput("");
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
