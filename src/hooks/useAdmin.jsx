import { useMutation, useQuery } from "@tanstack/react-query";
import { request } from "../api/apiClient";

/**
 * Récupère la liste des administrateurs.
 */
export const useGetAdmins = () => {
  return useQuery({
    queryKey: ["useGetAdmins"],
    queryFn: () => request("/api/admin/admins", "GET"),
    refetchOnWindowFocus: false,
  });
};

/**
 * Crée un nouvel administrateur.
 */
export const useCreateAdmin = () => {
  return useMutation({
    mutationKey: ["useCreateAdmin"],
    mutationFn: (formData) => request("/api/admin/admins", "POST", formData),
  });
};

/**
 * Promeut un utilisateur existant en administrateur.
 */
export const usePromoteAdmin = () => {
  return useMutation({
    mutationKey: ["usePromoteAdmin"],
    mutationFn: ({ id }) => request(`/api/admin/admins/${id}/promote`, "PUT"),
  });
};

/**
 * Rétrograde un administrateur en client.
 */
export const useDemoteAdmin = () => {
  return useMutation({
    mutationKey: ["useDemoteAdmin"],
    mutationFn: ({ id }) => request(`/api/admin/admins/${id}/demote`, "PUT"),
  });
};
