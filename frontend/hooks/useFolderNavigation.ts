import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { SortBy, SortOrder } from "@/lib/types";

export function useFolderNavigation() {
  // Next.js tools
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Extract parsed folder id, and convert back to number
  const folderIdString = searchParams.get("folder_id");
  const parsed = folderIdString ? Number(folderIdString) : undefined;
  const currentFolderId = parsed !== undefined && !Number.isNaN(parsed) ? parsed : undefined;

  // Extract search and sort values
  const search = (searchParams.get("search") ?? "").trim();
  const rawSortBy = searchParams.get("sort_by");
  const sortBy: SortBy = rawSortBy === "date" || rawSortBy === "name" || rawSortBy === "size" ? rawSortBy : "date";
  const rawSortOrder = searchParams.get("sort_order");
  const sortOrder: SortOrder = rawSortOrder === "asc" || rawSortOrder === "desc" ? rawSortOrder : "desc";

  // Forward folder navigation function
  const navigateToFolder = (folderId: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("folder_id", String(folderId));
    params.delete("search");
    router.push(`${pathname}?${params.toString()}`);
  };

  // Backward folder navigation function
  const navigateBack = () => {
    router.back();
  };

  // Helper function for setSearch/Sort router.replace()
  const replaceParams = (params: URLSearchParams) => {
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  };

  const setSearch = (value: string) => {
    // Early exit on same search value
    const trimmedValue = value.trim();
    if (trimmedValue === search) return;

    const params = new URLSearchParams(searchParams.toString());

    // Set params if value is a non-empty string, else delete search params
    if (trimmedValue.length > 0) params.set("search", trimmedValue);
    else params.delete("search");

    replaceParams(params);
  };

  // "next"Sorts naming convention to not match the declared ones up top
  const setSort = (nextSortBy: SortBy, nextSortOrder: SortOrder) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort_by", nextSortBy);
    params.set("sort_order", nextSortOrder);
    replaceParams(params);
  };

  return {
    search,
    sortBy,
    sortOrder,
    setSearch,
    setSort,
    currentFolderId,
    navigateToFolder,
    navigateBack,
  };
}
