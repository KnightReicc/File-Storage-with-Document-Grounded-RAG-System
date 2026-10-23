"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SortMenu } from "@/components/files/sort-menu";
import { MessageSquareText, Search, Upload, FolderPlus } from "lucide-react";
import { useFolderNavigation } from "@/hooks/useFolderNavigation";
import { useEffect, useState } from "react";

interface TopBarProps {
  onToggleRagPanel: () => void;
  onOpenUpload: () => void;
  onOpenCreateFolder: () => void;
}

export function TopBar({ onToggleRagPanel, onOpenUpload, onOpenCreateFolder }: TopBarProps) {
  const { search, sortBy, sortOrder, setSearch, setSort } = useFolderNavigation();
  const [inputValue, setInputValue] = useState(search);
  const [prevSearch, setPrevSearch] = useState(search);
  const [lastWritten, setLastWritten] = useState(search);

  // Sync input from the URL only when the change didn't come from own write
  if (search !== prevSearch) {
    setPrevSearch(search);
    if (search !== lastWritten) {
      setInputValue(search);
    }
    setLastWritten(search);
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = inputValue.trim();
      setLastWritten(trimmed);
      setSearch(trimmed);
    }, 300);

    return () => clearTimeout(timer);
  }, [inputValue, setSearch]);

  return (
    <div className="flex items-center gap-3 border-b p-3">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          value={inputValue}
          placeholder="Search files..."
          className="pl-8"
          aria-label="Search files"
          onChange={(e) => {
            setInputValue(e.target.value);
          }}
        />
      </div>

      <SortMenu sortBy={sortBy} sortOrder={sortOrder} onChange={setSort} />

      <div className="flex-1" />

      <Button size="sm" className="gap-2" onClick={onOpenUpload}>
        <Upload className="h-4 w-4" />
        Upload
      </Button>

      <Button variant="outline" size="sm" className="gap-2" onClick={onOpenCreateFolder}>
        <FolderPlus className="h-4 w-4" />
        New Folder
      </Button>

      <Button variant="outline" size="icon" onClick={onToggleRagPanel} aria-label="Toggle RAG panel">
        <MessageSquareText className="h-4 w-4" />
      </Button>
    </div>
  );
}
