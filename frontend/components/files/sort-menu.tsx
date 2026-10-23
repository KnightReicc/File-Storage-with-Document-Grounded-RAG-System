"use client";

import { ArrowUpDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { SortBy, SortOrder } from "@/lib/types";

const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: "date", label: "Last modified" },
  { value: "name", label: "Name" },
  { value: "size", label: "Size" },
];

const ORDER_OPTIONS: { value: SortOrder; label: string }[] = [
  { value: "desc", label: "Descending" },
  { value: "asc", label: "Ascending" },
];

interface SortMenuProps {
  sortBy: SortBy;
  sortOrder: SortOrder;
  onChange: (sortBy: SortBy, sortOrder: SortOrder) => void;
}

export function SortMenu({ sortBy, sortOrder, onChange }: SortMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" size="sm" className="gap-2" />}>
        <ArrowUpDown className="h-4 w-4" />
        Sort
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <div className="px-1.5 py-1 text-xs font-medium text-muted-foreground">Sort by</div>
        {SORT_OPTIONS.map((option) => (
          <DropdownMenuItem key={option.value} onClick={() => onChange(option.value, sortOrder)}>
            <span className="w-4">{sortBy === option.value && <Check className="h-4 w-4" />}</span>
            {option.label}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <div className="px-1.5 py-1 text-xs font-medium text-muted-foreground">Order</div>
        {ORDER_OPTIONS.map((option) => (
          <DropdownMenuItem key={option.value} onClick={() => onChange(sortBy, option.value)}>
            <span className="w-4">{sortOrder === option.value && <Check className="h-4 w-4" />}</span>
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
