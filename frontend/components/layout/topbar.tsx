"use client";

import { Button } from "@/components/ui/button";
import { SortMenu } from "@/components/files/sort-menu";
import { MessageSquareText, Upload, FolderPlus } from "lucide-react";
import { useFolderNavigation } from "@/hooks/useFolderNavigation";
import { usePathname } from "next/navigation";
import { SearchBox } from "../files/search-box";

interface TopBarProps {
  onToggleRagPanel: () => void;
  onOpenUpload: () => void;
  onOpenCreateFolder: () => void;
}

export function TopBar({ onToggleRagPanel, onOpenUpload, onOpenCreateFolder }: TopBarProps) {
  const pathname = usePathname();
  const { sortBy, sortOrder, setSort } = useFolderNavigation();
  const isDashboard = pathname === "/";

  return (
    <div className="flex items-center gap-3 border-b p-3">
      {isDashboard && <SearchBox />}

      {isDashboard && <SortMenu sortBy={sortBy} sortOrder={sortOrder} onChange={setSort} />}

      <div className="flex-1" />

      {isDashboard && (
        <>
          <Button size="sm" className="gap-2" onClick={onOpenUpload}>
            <Upload className="h-4 w-4" />
            Upload
          </Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={onOpenCreateFolder}>
            <FolderPlus className="h-4 w-4" />
            New Folder
          </Button>
        </>
      )}

      <Button variant="outline" size="icon" onClick={onToggleRagPanel} aria-label="Toggle RAG panel">
        <MessageSquareText className="h-4 w-4" />
      </Button>
    </div>
  );
}
