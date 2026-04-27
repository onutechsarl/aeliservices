import React from "react";
import { ToastContainer } from "react-toastify";
import { ForgotPasswordForm } from "../components/auth/FogotPasswordForm";

/**
 * UI component responsible for rendering forgot password screen.
 */
export function ForgotPasswordScreen() {
  return (
    <>
      <ForgotPasswordForm />
      <ToastContainer position="bottom-center" />
    </>
  );
}
