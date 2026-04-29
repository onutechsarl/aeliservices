import { useMutation, useQuery } from "@tanstack/react-query";
import { request } from "../api/apiClient";

/**
 * Custom hook that manages the get users workflow.
 */
export const useGetUsers = (page) => {
  return useQuery({
    queryKey: ["useGetUsers", page],
    queryFn: () => request(`/api/admin/users?page=${page}`, "GET"),
    refetchOnWindowFocus: false,
    keepPreviousData: true, // Évite que l'écran ne clignote lors du changement de page
  });
};

/**
 * Custom hook that manages the deactivate account workflow.
 */
export const useDeactivateAccount = () => {
  return useMutation({
    mutationKey: ["useDeactivateAccount"],
    mutationFn: ({ id, formData }) =>
      request(`/api/admin/users/${id}/status`, "PUT", formData),
  });
};
