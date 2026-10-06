"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface RenameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentName: string;
  isPending: boolean;
  onSubmit: (newName: string) => void;
  type: "folder" | "document";
}

function splitExtension(fullName: string): { base: string; ext: string } {
  const lastDot = fullName.lastIndexOf(".");
  if (lastDot <= 0) return { base: fullName, ext: "" }; // no dot, or a leading dot (e.g. ".gitignore")
  return { base: fullName.slice(0, lastDot), ext: fullName.slice(lastDot) };
}

export function RenameDialog({ open, onOpenChange, currentName, isPending, onSubmit, type }: RenameDialogProps) {
  const { base: currentBase, ext } = type === "document" ? splitExtension(currentName) : { base: currentName, ext: "" };

  const [base, setBase] = useState(currentBase);
  const [prevOpen, setPrevOpen] = useState(open);

  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setBase(currentBase);
    }
  }

  const handleSubmit = () => {
    const trimmed = base.trim();
    onSubmit(type === "document" ? `${trimmed}${ext}` : trimmed);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename</DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-1">
          <Input value={base} onChange={(e) => setBase(e.target.value)} autoFocus className="flex-1" />
          {ext && <span className="text-sm text-muted-foreground">{ext}</span>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={isPending || base.trim().length === 0} onClick={handleSubmit}>
            {isPending ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
