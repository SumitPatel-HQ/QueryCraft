"use client";

import { useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface DeleteDatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  databaseName: string;
}

export default function DeleteDatabaseModal({
  isOpen,
  onClose,
  onConfirm,
  databaseName,
}: DeleteDatabaseModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      // Error handling is managed by the caller usually, but we keep the state here
      console.error("Deletion failed:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isDeleting && onClose()}>
      <DialogContent className="bg-[#0a0a0a] border border-[rgba(255,255,255,0.1)] rounded-[12px] w-full max-w-[400px] p-6 text-[#f0f0f0] sm:rounded-[12px] shadow-2xl">
        <DialogHeader className="flex flex-col items-center text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-red-500/5 flex items-center justify-center mb-2">
            <AlertTriangle className="text-red-500/70" size={24} />
          </div>
          <DialogTitle className="text-[18px] font-semibold text-white">
            Delete Database
          </DialogTitle>
          <DialogDescription className="text-[14px] text-[#888888] leading-relaxed">
            Are you sure you want to delete <span className="text-[#f0f0f0] font-medium">"{databaseName}"</span>? 
            This action cannot be undone and all associated data will be permanently removed.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="mt-8 flex gap-3 sm:justify-center w-full">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isDeleting}
              className="flex-1 bg-transparent hover:bg-[rgba(255,255,255,0.05)] text-[#888888] hover:text-white border border-transparent hover:border-[rgba(255,255,255,0.1)] transition-all"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex-1 bg-red-500/60 hover:bg-red-500 text-white font-medium shadow-[0_0_20px_rgba(220,38,38,0.1)] transition-all duration-300"
            >
              {isDeleting ? (
                <div className="flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  Deleting...
                </div>
              ) : (
                "Delete Database"
              )}
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
