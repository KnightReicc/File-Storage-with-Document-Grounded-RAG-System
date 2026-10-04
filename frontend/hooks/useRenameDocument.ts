import { useMutation, useQueryClient } from "@tanstack/react-query";
import { renameDocument } from "@/lib/api/documents";

export function useRenameDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) => renameDocument(id, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folders", "contents"] });
    },
  });
}
