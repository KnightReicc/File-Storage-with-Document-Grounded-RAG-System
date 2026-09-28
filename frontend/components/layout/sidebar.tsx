"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { FolderOpen, Grid2X2, List, User } from "lucide-react";

interface SidebarProps {
  view: "grid" | "list";
  onViewChange: (view: "grid" | "list") => void;
}

export function Sidebar({ view, onViewChange }: SidebarProps) {
  return (
    <aside className="w-60 shrink-0 border-r flex flex-col h-full">
      <div className="p-4 flex items-center gap-2">
        <FolderOpen className="h-5 w-5" />
        <span className="font-semibold">FileVault</span>
      </div>

      <Separator />

      <div className="p-4 flex flex-col gap-2">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          View
        </span>
        <div className="flex gap-2">
          <Button
            variant={view === "grid" ? "default" : "outline"}
            size="icon"
            onClick={() => onViewChange("grid")}
            aria-label="Grid view"
          >
            <Grid2X2 className="h-4 w-4" />
          </Button>
          <Button
            variant={view === "list" ? "default" : "outline"}
            size="icon"
            onClick={() => onViewChange("list")}
            aria-label="List view"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="mt-auto p-4">
        <Separator className="mb-4" />
        <Button variant="ghost" className="w-full justify-start gap-2">
          <User className="h-4 w-4" />
          Profile
        </Button>
      </div>
    </aside>
  );
}
