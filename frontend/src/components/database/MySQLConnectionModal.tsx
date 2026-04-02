"use client";

import { useMemo, useState } from "react";
import { Loader2, ServerCog } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useApi } from "@/hooks/use-api";
import type { DatabaseResponse, MySQLConnectionCreate } from "@/types/api";

interface MySQLConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (database: DatabaseResponse) => void;
}

const initialFormState: MySQLConnectionCreate = {
  display_name: "",
  description: "",
  host: "",
  port: 3306,
  database: "",
  username: "",
  password: "",
  ssl: true,
  auth_plugin: null,
};

export default function MySQLConnectionModal({
  isOpen,
  onClose,
  onSuccess,
}: MySQLConnectionModalProps) {
  const api = useApi();
  const [form, setForm] = useState<MySQLConnectionCreate>(initialFormState);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(
    () =>
      Boolean(
        form.display_name.trim() &&
          form.host.trim() &&
          form.database.trim() &&
          form.username.trim() &&
          form.password.trim()
      ),
    [form]
  );

  const updateField = <K extends keyof MySQLConnectionCreate>(
    field: K,
    value: MySQLConnectionCreate[K]
  ) => {
    setForm((current) => ({ ...current, [field]: value }));
    setError(null);
  };

  const resetForm = () => {
    setForm(initialFormState);
    setError(null);
    setSubmitting(false);
  };

  const handleClose = () => {
    if (submitting) return;
    resetForm();
    onClose();
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) {
      setError("Fill in the required connection fields.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const created = await api.createMySQLConnection({
        ...form,
        display_name: form.display_name.trim(),
        description: form.description?.trim() || undefined,
        host: form.host.trim(),
        database: form.database.trim(),
        username: form.username.trim(),
      });
      onSuccess(created);
      resetForm();
      onClose();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Could not connect to MySQL."
      );
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-[600px] border border-[rgba(255,255,255,0.08)] bg-[#0a0a0a] p-0 text-[#f0f0f0] shadow-2xl sm:rounded-[12px] overflow-hidden">
        <DialogHeader className="px-6 py-5 border-b border-[rgba(255,255,255,0.08)]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[rgba(255,255,255,0.08)] bg-[#111111] text-[#f0f0f0]">
              <ServerCog className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <DialogTitle className="text-[18px] font-semibold tracking-tight text-[#f0f0f0]">
                Connect live MySQL
              </DialogTitle>
              <DialogDescription className="text-[13px] text-[#888888]">
                Verify a live MySQL database and sync its schema instantly.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="max-h-[60vh] overflow-y-auto px-6 py-6 custom-scrollbar">
            <div className="grid gap-x-4 gap-y-5 sm:grid-cols-2">
              <label className="space-y-1.5 sm:col-span-2">
                <span className="text-[11px] font-medium uppercase tracking-wider text-[#888888]">
                  Display Name *
                </span>
                <input
                  value={form.display_name}
                  onChange={(event) => updateField("display_name", event.target.value)}
                  disabled={submitting}
                  placeholder="Analytics Warehouse"
                  className="w-full rounded-lg border border-[rgba(255,255,255,0.08)] bg-[#111111] px-4 py-2.5 text-[14px] text-[#f0f0f0] placeholder:text-[#444444] outline-none transition focus:border-[rgba(255,255,255,0.2)]"
                />
              </label>

              <label className="space-y-1.5 sm:col-span-2">
                <span className="text-[11px] font-medium uppercase tracking-wider text-[#888888]">
                  Description (Optional)
                </span>
                <textarea
                  value={form.description ?? ""}
                  onChange={(event) => updateField("description", event.target.value)}
                  disabled={submitting}
                  rows={2}
                  placeholder="Optional note for teammates..."
                  className="w-full resize-none rounded-lg border border-[rgba(255,255,255,0.08)] bg-[#111111] px-4 py-2.5 text-[14px] text-[#f0f0f0] placeholder:text-[#444444] outline-none transition focus:border-[rgba(255,255,255,0.2)]"
                />
              </label>

              <label className="space-y-1.5 sm:col-span-2">
                <span className="text-[11px] font-medium uppercase tracking-wider text-[#888888]">
                  Host *
                </span>
                <input
                  value={form.host}
                  onChange={(event) => updateField("host", event.target.value)}
                  disabled={submitting}
                  placeholder="db.internal"
                  className="w-full rounded-lg border border-[rgba(255,255,255,0.08)] bg-[#111111] px-4 py-2.5 text-[14px] text-[#f0f0f0] placeholder:text-[#444444] outline-none transition focus:border-[rgba(255,255,255,0.2)]"
                />
              </label>

              <label className="space-y-1.5">
                <span className="text-[11px] font-medium uppercase tracking-wider text-[#888888]">
                  Port *
                </span>
                <input
                  type="number"
                  min={1}
                  max={65535}
                  value={form.port ?? 3306}
                  onChange={(event) => updateField("port", Number(event.target.value) || 3306)}
                  disabled={submitting}
                  className="w-full rounded-lg border border-[rgba(255,255,255,0.08)] bg-[#111111] px-4 py-2.5 text-[14px] text-[#f0f0f0] outline-none transition focus:border-[rgba(255,255,255,0.2)]"
                />
              </label>

              <label className="space-y-1.5">
                <span className="text-[11px] font-medium uppercase tracking-wider text-[#888888]">
                  Database *
                </span>
                <input
                  value={form.database}
                  onChange={(event) => updateField("database", event.target.value)}
                  disabled={submitting}
                  placeholder="analytics"
                  className="w-full rounded-lg border border-[rgba(255,255,255,0.08)] bg-[#111111] px-4 py-2.5 text-[14px] text-[#f0f0f0] placeholder:text-[#444444] outline-none transition focus:border-[rgba(255,255,255,0.2)]"
                />
              </label>

              <label className="space-y-1.5">
                <span className="text-[11px] font-medium uppercase tracking-wider text-[#888888]">
                  Username *
                </span>
                <input
                  value={form.username}
                  onChange={(event) => updateField("username", event.target.value)}
                  disabled={submitting}
                  placeholder="root"
                  className="w-full rounded-lg border border-[rgba(255,255,255,0.08)] bg-[#111111] px-4 py-2.5 text-[14px] text-[#f0f0f0] placeholder:text-[#444444] outline-none transition focus:border-[rgba(255,255,255,0.2)]"
                />
              </label>

              <label className="space-y-1.5">
                <span className="text-[11px] font-medium uppercase tracking-wider text-[#888888]">
                  Password *
                </span>
                <input
                  type="password"
                  value={form.password}
                  onChange={(event) => updateField("password", event.target.value)}
                  disabled={submitting}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-[rgba(255,255,255,0.08)] bg-[#111111] px-4 py-2.5 text-[14px] text-[#f0f0f0] placeholder:text-[#444444] outline-none transition focus:border-[rgba(255,255,255,0.2)]"
                />
              </label>

              <label className="space-y-1.5 sm:col-span-2">
                <span className="text-[11px] font-medium uppercase tracking-wider text-[#888888]">
                  Auth Plugin (Optional)
                </span>
                <input
                  value={form.auth_plugin ?? ""}
                  onChange={(event) =>
                    updateField(
                      "auth_plugin",
                      event.target.value.trim() ? event.target.value.trim() : null
                    )
                  }
                  disabled={submitting}
                  placeholder="caching_sha2_password"
                  className="w-full rounded-lg border border-[rgba(255,255,255,0.08)] bg-[#111111] px-4 py-2.5 text-[14px] text-[#f0f0f0] placeholder:text-[#444444] outline-none transition focus:border-[rgba(255,255,255,0.2)]"
                />
              </label>

              <div className="flex items-center justify-between sm:col-span-2 rounded-lg border border-[rgba(255,255,255,0.08)] bg-[#111111]/50 px-4 py-3">
                <div className="space-y-0.5">
                  <div className="text-[14px] font-medium text-[#f0f0f0]">Require SSL</div>
                  <div className="text-[12px] text-[#888888]">
                    Ensure transport is encrypted for secure connections.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={Boolean(form.ssl)}
                  onChange={(event) => updateField("ssl", event.target.checked)}
                  disabled={submitting}
                  className="h-4 w-4 rounded border-[rgba(255,255,255,0.2)] bg-transparent accent-white"
                />
              </div>
            </div>

            {error && (
              <div className="mt-5 rounded-lg border border-red-900/20 bg-red-950/20 px-4 py-3 text-[13px] text-red-400">
                {error}
              </div>
            )}
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end px-6 py-4 border-t border-[rgba(255,255,255,0.08)] bg-[#0a0a0a]">
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
              disabled={submitting}
              className="rounded-lg px-6 py-2.5 text-[14px] text-[#888888] hover:text-[#f0f0f0] hover:bg-[#1a1a1a] transition-all"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || !canSubmit}
              className="rounded-lg bg-[#f0f0f0] px-6 py-2.5 text-[14px] font-semibold text-[#0a0a0a] hover:bg-[#ffffff] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Connecting...
                </span>
              ) : (
                "Save Connection"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );

}
