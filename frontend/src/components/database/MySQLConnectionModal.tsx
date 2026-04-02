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
      <DialogContent className="max-w-[560px] border border-white/10 bg-[#0b0d10] p-0 text-white sm:rounded-2xl">
        <div className="border-b border-white/8 bg-[radial-gradient(circle_at_top,_rgba(20,184,166,0.18),_transparent_48%)] px-6 py-5">
          <DialogHeader className="space-y-2 text-left">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10 text-emerald-200">
              <ServerCog className="h-5 w-5" />
            </div>
            <DialogTitle className="text-xl font-semibold tracking-tight text-white">
              Connect live MySQL
            </DialogTitle>
            <DialogDescription className="max-w-[44ch] text-sm text-slate-300">
              Verify a live MySQL database, store its schema, and surface the
              connection in the sidebar instantly.
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 sm:col-span-2">
              <span className="text-xs uppercase tracking-[0.24em] text-slate-400">
                Display name
              </span>
              <input
                value={form.display_name}
                onChange={(event) => updateField("display_name", event.target.value)}
                disabled={submitting}
                placeholder="Analytics Warehouse"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-300/40 focus:bg-white/8"
              />
            </label>

            <label className="space-y-2 sm:col-span-2">
              <span className="text-xs uppercase tracking-[0.24em] text-slate-400">
                Description
              </span>
              <textarea
                value={form.description ?? ""}
                onChange={(event) => updateField("description", event.target.value)}
                disabled={submitting}
                rows={3}
                placeholder="Optional note for teammates"
                className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-300/40 focus:bg-white/8"
              />
            </label>

            <label className="space-y-2 sm:col-span-2">
              <span className="text-xs uppercase tracking-[0.24em] text-slate-400">
                Host
              </span>
              <input
                value={form.host}
                onChange={(event) => updateField("host", event.target.value)}
                disabled={submitting}
                placeholder="db.internal"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-300/40 focus:bg-white/8"
              />
            </label>

            <label className="space-y-2">
              <span className="text-xs uppercase tracking-[0.24em] text-slate-400">
                Port
              </span>
              <input
                type="number"
                min={1}
                max={65535}
                value={form.port ?? 3306}
                onChange={(event) => updateField("port", Number(event.target.value) || 3306)}
                disabled={submitting}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-300/40 focus:bg-white/8"
              />
            </label>

            <label className="space-y-2">
              <span className="text-xs uppercase tracking-[0.24em] text-slate-400">
                Database
              </span>
              <input
                value={form.database}
                onChange={(event) => updateField("database", event.target.value)}
                disabled={submitting}
                placeholder="analytics"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-300/40 focus:bg-white/8"
              />
            </label>

            <label className="space-y-2">
              <span className="text-xs uppercase tracking-[0.24em] text-slate-400">
                Username
              </span>
              <input
                value={form.username}
                onChange={(event) => updateField("username", event.target.value)}
                disabled={submitting}
                placeholder="reporter"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-300/40 focus:bg-white/8"
              />
            </label>

            <label className="space-y-2">
              <span className="text-xs uppercase tracking-[0.24em] text-slate-400">
                Password
              </span>
              <input
                type="password"
                value={form.password}
                onChange={(event) => updateField("password", event.target.value)}
                disabled={submitting}
                placeholder="••••••••"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-300/40 focus:bg-white/8"
              />
            </label>
          </div>

          <label className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
            <div>
              <div className="text-sm font-medium text-white">Require SSL</div>
              <div className="text-xs text-slate-400">
                Keep transport encrypted for hosted production databases.
              </div>
            </div>
            <input
              type="checkbox"
              checked={Boolean(form.ssl)}
              onChange={(event) => updateField("ssl", event.target.checked)}
              disabled={submitting}
              className="h-4 w-4 rounded border-white/20 bg-transparent accent-emerald-400"
            />
          </label>

          {error ? (
            <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </div>
          ) : null}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
              disabled={submitting}
              className="rounded-xl border border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/[0.06] hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || !canSubmit}
              className="rounded-xl bg-emerald-300 text-[#04110d] hover:bg-emerald-200"
            >
              {submitting ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Connecting...
                </span>
              ) : (
                "Create MySQL connection"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
