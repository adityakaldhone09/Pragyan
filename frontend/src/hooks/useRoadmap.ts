import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { roadmapService } from "@/services/roadmapService";

export function useRoadmap(career = "Data Scientist") {
  const queryClient = useQueryClient();
  const roadmap = useQuery({
    queryKey: ["roadmap", career],
    queryFn: () => roadmapService.getByCareer(career),
  });

  const progress = useQuery({
    queryKey: ["roadmap", career, roadmap.data?.id, "progress"],
    queryFn: () => roadmapService.getProgress(roadmap.data?.id || ""),
    enabled: Boolean(roadmap.data?.id),
  });

  const updateTask = useMutation({
    mutationFn: ({ taskId, ...input }: { taskId: string; roadmapId: string; totalTasks: number; dayId?: string; completed: boolean; xpReward?: number }) =>
      roadmapService.updateTask(taskId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["roadmap"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  return { roadmap, progress, updateTask };
}
