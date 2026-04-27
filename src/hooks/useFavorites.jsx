import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { request } from "../api/apiClient";

/**
 * Custom hook that manages get favorites.
 */
export const useGetFavorites = () => {
    return useQuery({
        queryKey: ["useGetFavorites"],
        queryFn: () => request(`/api/favorites`, "GET"),
    });
};

/**
 * Custom hook that manages check favorites.
 */
export const useCheckFavorites = (id) => {
    return useQuery({
        queryKey: ["useCheckFavorites", id],
        queryFn: () => request(`/api/favorites/check/${id}`, "GET"),
    });
};

/**
 * Custom hook that manages add to favorites.
 */
export const useAddToFavorites = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationKey: ["useAddToFavorites"],
        mutationFn: (formData) => request("/api/favorites", "POST", formData),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ["useGetFavorites"] });
            queryClient.invalidateQueries({ queryKey: ["useGetProviderList"] });
            if (variables?.providerId) {
                queryClient.invalidateQueries({
                    queryKey: ["useCheckFavorites", variables.providerId]
                });
            }
        },
    });
};

/**
 * Custom hook that manages delete favorites.
 */
export const useDeleteFavorites = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationKey: ["useDeleteFavorites"],
        mutationFn: ({ id }) => request(`/api/favorites/${id}`, "DELETE"),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ["useGetFavorites"] });
            queryClient.invalidateQueries({ queryKey: ["useGetProviderList"] });

            if (variables?.id) {
                queryClient.invalidateQueries({
                    queryKey: ["useCheckFavorites", variables.id]
                });
            }
        },
    });
};