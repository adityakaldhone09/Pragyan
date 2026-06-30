import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { profileService } from "@/services/profileService";

export function useProfile() {
  const queryClient = useQueryClient();
  const profile = useQuery({
    queryKey: ["profile"],
    queryFn: profileService.getProfile,
  });

  const updateProfile = useMutation({
    mutationFn: profileService.updateProfile,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });

  return { ...profile, updateProfile };
}
