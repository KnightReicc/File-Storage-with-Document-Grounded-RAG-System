"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useFolderNavigation } from "@/hooks/useFolderNavigation";

export function SearchBox() {
  const { search, setSearch } = useFolderNavigation();
  const [inputValue, setInputValue] = useState(search);
  const [prevSearch, setPrevSearch] = useState(search);
  const [lastWritten, setLastWritten] = useState(search);

  // Sync input from the URL only when the change didn't come from our own write
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
    <div className="relative flex-1 max-w-sm">
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        value={inputValue}
        placeholder="Search files..."
        className="pl-8"
        aria-label="Search files"
        onChange={(e) => setInputValue(e.target.value)}
      />
    </div>
  );
}
