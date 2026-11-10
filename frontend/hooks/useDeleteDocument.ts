import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteDocument } from "@/lib/api/documents";

export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteDocument,
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["folders", "contents"] });
      queryClient.removeQueries({ queryKey: ["documents", id] });
    },
  });
}
