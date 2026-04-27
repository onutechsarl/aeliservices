import React from "react";
import { ToastContainer } from "react-toastify";
import { ResetPasswordForm } from "../components/auth/ResetPasswordForm";

/**
 * UI component responsible for rendering login screen.
 */
export function ResetPasswordScreen() {
  return (
    <>
      <ResetPasswordForm />
      <ToastContainer position="bottom-center" />
    </>
  );
}
