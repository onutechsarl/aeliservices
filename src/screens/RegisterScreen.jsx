import React from 'react';
import { ToastContainer } from 'react-toastify';
import { RegisterForm } from '../components/auth/RegisterForm';

/**
 * UI component responsible for rendering register screen.
 */
export function RegisterScreen() {
  return (
    <>
      <RegisterForm />
      <ToastContainer position="bottom-center" />
    </>
  )
}