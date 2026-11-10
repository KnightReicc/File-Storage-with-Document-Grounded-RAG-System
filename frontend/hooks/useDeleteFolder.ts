import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteFolder } from "@/lib/api/folders";

export function useDeleteFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteFolder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folders", "contents"] });
      queryClient.removeQueries({ queryKey: ["documents"] });
    },
  });
}
