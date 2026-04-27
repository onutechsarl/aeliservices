import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { request } from "../api/apiClient";

/**
 * Custom hook that manages info user connected.
 */
export const useInfoUserConnected = () => {
    return useQuery({
        queryKey: ["useInfoUserConnected"],
        queryFn: () => request("/api/users/profile", "GET"),

        refetchOnWindowFocus: false,
    });
};

/**
 * Custom hook that manages update profile.
 */
export const useUpdateProfile = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationKey: ["useUpdateProfile"],
        mutationFn: (formData) => request("/api/users/profile", "PUT", formData),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["useInfoUserConnected"] });
        },
    });
};