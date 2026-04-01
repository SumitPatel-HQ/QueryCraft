"use client";

import { useState } from "react";
import { Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApi } from "@/hooks/use-api";
import type { DatabaseUploadResponse } from "@/types/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DatabaseUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: DatabaseUploadResponse) => void;
}

export default function DatabaseUploadModal({
  isOpen,
  onClose,
  onSuccess,
}: DatabaseUploadModalProps) {
  const api = useApi();
  const [file, setFile] = useState<File | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      
      // Auto-populate display name from filename
      if (!displayName) {
        const name = selectedFile.name.replace(/\.(db|sqlite|sql|csv)$/i, "");
        setDisplayName(name);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      setError("Please select a file");
      return;
    }
    
    if (!displayName.trim()) {
      setError("Please provide a display name");
      return;
    }

    // Validate file type
    const allowedExtensions = [".db", ".sqlite", ".sql", ".csv"];
    const fileExt = file.name.toLowerCase().match(/\.[^.]+$/)?.[0];
    if (!fileExt || !allowedExtensions.includes(fileExt)) {
      setError(`Invalid file type. Allowed: ${allowedExtensions.join(", ")}`);
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const result = await api.uploadDatabase(
        file,
        displayName.trim(),
        description.trim() || undefined
      );
      onSuccess(result);
      
      // Reset form
      setFile(null);
      setDisplayName("");
      setDescription("");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-[#0a0a0a] border border-[rgba(255,255,255,0.1)] rounded-[12px] w-full max-w-[500px] p-6 text-[#f0f0f0] sm:rounded-[12px]">
        <DialogHeader className="mb-6">
          <DialogTitle className="text-[18px] font-semibold text-[#f0f0f0]">
            Upload Database
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* File Input */}
          <div>
            <label className="block text-[12px] text-[#888888] mb-2">
              Database File
            </label>
            <div className="relative">
              <input
                type="file"
                accept=".db,.sqlite,.sql,.csv"
                onChange={handleFileChange}
                disabled={uploading}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="flex items-center justify-center gap-2 bg-[#111111] border border-[rgba(255,255,255,0.08)] rounded-[8px] p-4 cursor-pointer hover:border-[rgba(255,255,255,0.15)] transition-colors"
              >
                <Upload size={18} className="text-[#888888]" />
                <span className="text-[14px] text-[#f0f0f0]">
                  {file ? file.name : "Choose file (.db, .sqlite, .sql, .csv)"}
                </span>
              </label>
            </div>
          </div>

          {/* Display Name */}
          <div>
            <label className="block text-[12px] text-[#888888] mb-2">
              Display Name *
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              disabled={uploading}
              placeholder="e.g., E-commerce Database"
              className="w-full bg-[#111111] border border-[rgba(255,255,255,0.08)] rounded-[8px] px-4 py-2 text-[14px] text-[#f0f0f0] placeholder:text-[#444444] focus:outline-none focus:border-[rgba(255,255,255,0.2)]"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[12px] text-[#888888] mb-2">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={uploading}
              placeholder="Brief description of the database..."
              rows={3}
              className="w-full bg-[#111111] border border-[rgba(255,255,255,0.08)] rounded-[8px] px-4 py-2 text-[14px] text-[#f0f0f0] placeholder:text-[#444444] focus:outline-none focus:border-[rgba(255,255,255,0.2)] resize-none"
            />
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-900/20 border border-red-900/50 rounded-[8px] p-3 text-red-400 text-[13px]">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={uploading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={uploading || !file}
              className="flex-1 flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Uploading...
                </>
              ) : (
                "Upload"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
