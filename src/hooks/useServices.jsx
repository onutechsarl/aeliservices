import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { request } from "../api/apiClient";

/**
 * Custom hook that manages create categories.
 */
export const useCreateCategories = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationKey: ["useCreateCategories"],
        mutationFn: (formData) => request("/api/services/categories", "POST", formData),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["useGetCategory"] });
        },
    });
};

/**
 * Custom hook that manages get category.
 */
export const useGetCategory = () => {
    return useQuery({
        queryKey: ["useGetCategory"],
        queryFn: () => request(`/api/services/categories`, "GET"),
        refetchOnWindowFocus: false,
    });
};

/**
 * Custom hook that manages get services by provider.
 */
export const useGetServicesByProvider = (id) => {
    return useQuery({
        queryKey: ["useGetServicesByProvider", id],
        queryFn: () => request(`/api/services/provider/${id}`, "GET"),
        refetchOnWindowFocus: false,
    });
};

/**
 * Custom hook that manages create services.
 */
export const useCreateServices = () => {
    return useMutation({
        mutationKey: ["useCreateServices"],
        mutationFn: (formData) => request("/api/services", "POST", formData),
    });
};

/**
 * Custom hook that manages update services.
 */
export const useUpdateServices = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationKey: ["useUpdateServices"],
        mutationFn: ({ id, formData }) => request(`/api/services/${id}`, "PUT", formData),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["useGetServicesByProvider"] });
        },
    });
};

/**
 * Custom hook that manages delete services.
 */
export const useDeleteServices = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationKey: ["useDeleteServices"],
        mutationFn: ({ id }) => request(`/api/services/${id}`, "DELETE"),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["useGetServicesByProvider"] });
        },
    });
};