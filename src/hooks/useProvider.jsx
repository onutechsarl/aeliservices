import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { request } from "../api/apiClient";

/**
 * Custom hook that manages apply provider.
 */
export const useApplyProvider = () => {
    return useMutation({
        mutationKey: ["useApplyProvider"],
        mutationFn: (formData) => request("/api/providers/apply", "POST", formData),
    });
};

/**
 * Custom hook that consult apply .
 */
export const useGetProviderApplication = () => {
    return useQuery({
        queryKey: ["useGetProviderApplication"],
        queryFn: () => request(`/api/providers/my-application`, "GET"),
        refetchOnWindowFocus: false,
    });
};

/**
 * Custom hook that manages get provider list.
 */

export const useGetProviderList = (params = {}) => {

    const queryString = new URLSearchParams(
        Object.fromEntries(Object.entries(params).filter(([_, v]) => v != null && v !== ""))
    ).toString();

    return useQuery({
        queryKey: ["useGetProviderList", params],
        queryFn: () => request(`/api/providers?${queryString}`, "GET"),
        refetchOnWindowFocus: false,
        enabled: true,
        // CORRECTION : Garde les données précédentes en cache pendant le nouveau chargement
        placeholderData: keepPreviousData,
        // Optionnel : définit une durée de mise en cache pour ne pas re-fetcher inutilement
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
};

/**
 * Custom hook that manages get provider byid.
 */
export const useGetProviderByid = (id) => {
    return useQuery({
        queryKey: ["useGetProviderByid", id],
        queryFn: () => request(`/api/providers/${id}`, "GET"),
        refetchOnWindowFocus: false,
        enabled: !!id,
    });
};

/**
 * Custom hook that manages get provider by slug.
 */
export const useGetProviderBySlug = (slug) => {
    return useQuery({
        queryKey: ["useGetProviderBySlug", slug],
        queryFn: () => request(`/api/providers/by-slug/${slug}`, "GET"),
        refetchOnWindowFocus: false,
        enabled: !!slug,
    });
};

/**
 * Custom hook that manages provider profile update.
 */
export const useUpdateProviderProfile = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationKey: ["useUpdateProviderProfile"],
        mutationFn: ({ id, formData }) => request(`/api/providers/${id}`, "PUT", formData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["useInfoUserConnected"] });
            queryClient.invalidateQueries({ queryKey: ["useGetProviderList"] });
            queryClient.invalidateQueries({ queryKey: ["useGetProviderByid"] });
        },
    });
};

/**
 * Custom hook that manages provider photo deletion.
 */
export const useDeleteProviderPhoto = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationKey: ["useDeleteProviderPhoto"],
        mutationFn: ({ id, photoIndex }) => request(`/api/providers/${id}/photos/${photoIndex}`, "DELETE"),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["useInfoUserConnected"] });
            queryClient.invalidateQueries({ queryKey: ["useGetProviderList"] });
            queryClient.invalidateQueries({ queryKey: ["useGetProviderByid"] });
        },
    });
};


/**
 * Get my document.
 */
export const useGetMyDocuments = (id) => {
    return useQuery({
        queryKey: ["useGetMyDocuments", id],
        queryFn: () => request(`/api/providers/${id}/documents`, "GET"),
        refetchOnWindowFocus: false,
    });
};

/**
 * Upluoad documents.
 */
export const useUploadDocument = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationKey: ["useUploadDocument"],
        mutationFn: ({ id, formData }) => request(`/api/providers/${id}/documents`, "POST", formData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["useGetMyDocuments"] });
        },
    });
};

/**
 * Delete documents from list.
 */
export const useDeleteDocument = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationKey: ["useDeleteDocument"],
        mutationFn: ({ id, docIndex }) => request(`/api/providers/${id}/documents/${docIndex}`, "DELETE"),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["useGetMyDocuments"] });
        },
    });
};
