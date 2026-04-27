import { useMutation } from "@tanstack/react-query";
import { request } from "../api/apiClient";

/**
 * Custom hook that manages the login workflow.
 */
export const useLogin = () => {
  return useMutation({
    mutationKey: ["useLogin"],
    mutationFn: (credentials) =>
      request("/api/auth/login", "POST", credentials),
  });
};

/**
 * Custom hook that manages forgot password.
 */
export const useForgotPassword = () => {
  return useMutation({
    mutationKey: ["forgot-password"],
    mutationFn: (formData) =>
      request("/api/auth/forgot-password", "POST", formData),
  });
};

/**
 * Custom hook that manages forgot password.
 */
export const useResetPassword = () => {
  return useMutation({
    mutationKey: ["useResetPassword"],
    mutationFn: ({ token, password }) =>
      request(`/api/auth/reset-password/${token}`, "POST", { password }),
  });
};
