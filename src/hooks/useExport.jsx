import { useMutation } from "@tanstack/react-query";
import { request } from "../api/apiClient";

/**
 * Custom hook that manages the export users workflow.
 */
export const useExportUsers = () => {
  return useMutation({
    mutationKey: ["useExportUsers"],
    mutationFn: () => request("/api/admin/export/users", "GET"),
  });
};

/**
 * Custom hook that manages the export providers workflow.
 */
export const useExportProviders = () => {
  return useMutation({
    mutationKey: ["useExportProviders"],
    mutationFn: () => request("/api/admin/export/providers", "GET"),
  });
};

/**
 * Custom hook that manages the export reviews workflow.
 */
export const useExportReviews = () => {
  return useMutation({
    mutationKey: ["useExportReviews"],
    mutationFn: () => request("/api/admin/export/reviews", "GET"),
  });
};

/**
 * Custom hook that manages the export contacts workflow.
 */
export const useExportContacts = () => {
  return useMutation({
    mutationKey: ["useExportContacts"],
    mutationFn: () => request("/api/admin/export/contacts", "GET"),
  });
};

/**
 * Custom hook that manages the export global report workflow.
 */
export const useExportGlobalReport = () => {
  return useMutation({
    mutationKey: ["useExportGlobalReport"],
    mutationFn: () => request("/api/admin/export/report", "GET"),
  });
};
