import React from "react";
import { ToastContainer } from "react-toastify";
import { LoginForm } from "../components/auth/LoginForm";
import { Footer } from "../components/global/Footer";

/**
 * UI component responsible for rendering the login screen section.
 */
export function LoginScreen() {
  return (
    <>
      <LoginForm />
      <ToastContainer position="bottom-center" />
    </>
  );
}
