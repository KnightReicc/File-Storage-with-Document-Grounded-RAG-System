import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteDocument } from "@/lib/api/documents";

export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folders", "contents"] });
    },
  });
}
