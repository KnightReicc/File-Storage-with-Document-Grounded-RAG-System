import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getFolderContents, GetFolderContentsArgs } from "@/lib/api/folders";

export function useFolderContents(args: GetFolderContentsArgs) {
  return useQuery({
    queryKey: ["folders", "contents", args],
    queryFn: () => getFolderContents(args),
    placeholderData: keepPreviousData,
  });
}
