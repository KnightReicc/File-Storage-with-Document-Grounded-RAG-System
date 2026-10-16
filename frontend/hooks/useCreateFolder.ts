import { createFolder } from "@/lib/api/folders";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useCreateFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createFolder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folders", "contents"] });
    },
  });
}
