import React from 'react';
import { ToastContainer } from 'react-toastify';
import { ProviderInfoForm } from "../components/RegistrationProvider/ProviderInfoForm";

/**
 * UI component responsible for rendering registration provider screen.
 */
export function RegistrationProviderScreen() {
  return (
    <>
      <ProviderInfoForm />
      <ToastContainer position="bottom-center" />
    </>

  )
}