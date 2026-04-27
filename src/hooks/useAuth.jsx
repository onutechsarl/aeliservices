import { useMutation } from "@tanstack/react-query";
import { request } from "../api/apiClient";

/**
 * Custom hook that manages register.
 */
export const useRegister = () => {
    return useMutation({
        mutationKey: ["useRegister"],
        mutationFn: (formData) => request("/api/auth/register", "POST", formData),
    });
};

/**
 * Custom hook that manages otp.
 */
export const useOtp = () => {
    return useMutation({
        mutationKey: ["useOtp"],
        mutationFn: (formData) => request("/api/auth/verify-otp", "POST", formData),
    });
};

/**
 * Custom hook that manages resend otp.
 */
export const useResendOtp = () => {
    return useMutation({
        mutationKey: ["useResendOtp"],
        mutationFn: (formData) => request("/api/auth/resend-otp", "POST", formData),
    });
};

/**
 * Custom hook that manages login.
 */
export const useLogin = () => {
    return useMutation({
        mutationKey: ["useLogin"],
        mutationFn: (credentials) => request("/api/auth/login", "POST", credentials),
    });
};

/**
 * Custom hook that manages logout.
 */
export const useLogout = () => {
    return useMutation({
        mutationKey: ["useLogout"],
        mutationFn: () => {
            const refreshToken = localStorage.getItem("refreshToken");
            const payload = refreshToken ? { refreshToken } : null;
            return request("/api/auth/logout", "POST", payload);
        },
    });
};

/**
 * Custom hook that manages forgot password.
 */
export const useForgotPassword = () => {
    return useMutation({
        mutationKey: ["forgot-password"],
        mutationFn: (formData) => request("/api/auth/forgot-password", "POST", formData),
    });
};


/**
 * Custom hook that manages forgot password.
 */
export const useResetPassword = () => {
    return useMutation({
        mutationKey: ["useResetPassword"],
        mutationFn: ({ token, password }) => request(`/api/auth/reset-password/${token}`, "POST", { password }),
    });
};

