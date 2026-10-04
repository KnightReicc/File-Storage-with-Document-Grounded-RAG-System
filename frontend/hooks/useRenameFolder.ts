import { useMutation, useQueryClient } from "@tanstack/react-query";
import { renameFolder } from "@/lib/api/folders";

export function useRenameFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) => renameFolder(id, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folders", "contents"] });
    },
  });
}
