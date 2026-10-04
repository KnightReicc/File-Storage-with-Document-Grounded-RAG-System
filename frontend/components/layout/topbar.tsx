"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowUpDown, MessageSquareText, Search, Upload } from "lucide-react";

interface TopBarProps {
  onToggleRagPanel: () => void;
  onOpenUpload: () => void;
}

export function TopBar({ onToggleRagPanel, onOpenUpload }: TopBarProps) {
  return (
    <div className="flex items-center gap-3 border-b p-3">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search files..." className="pl-8" />
      </div>

      <Button variant="outline" size="sm" className="gap-2">
        <ArrowUpDown className="h-4 w-4" />
        Sort
      </Button>

      <div className="flex-1" />

      <Button size="sm" className="gap-2" onClick={onOpenUpload}>
        <Upload className="h-4 w-4" />
        Upload
      </Button>

      <Button variant="outline" size="icon" onClick={onToggleRagPanel} aria-label="Toggle RAG panel">
        <MessageSquareText className="h-4 w-4" />
      </Button>
    </div>
  );
}
