import { useSearchParams, useRouter, usePathname } from "next/navigation";

export function useFolderNavigation() {
  // Next.js tools
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Extract parsed folder id, and convert back to number
  const folderIdString = searchParams.get("folder_id");
  const parsed = folderIdString ? Number(folderIdString) : undefined;
  const currentFolderId = parsed !== undefined && !Number.isNaN(parsed) ? parsed : undefined;

  // Forward folder navigation function
  const navigateToFolder = (folderId: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("folder_id", String(folderId));
    router.push(`${pathname}?${params.toString()}`);
  };

  // Backward folder navigation function
  const navigateBack = () => {
    router.back();
  };

  return {
    currentFolderId,
    navigateToFolder,
    navigateBack,
  };
}
