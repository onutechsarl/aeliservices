import React from 'react';
import { ToastContainer } from 'react-toastify';
import { LoginForm } from '../components/auth/LoginForm';

/**
 * UI component responsible for rendering login screen.
 */
export function LoginScreen() {
  return (
    <>
      <LoginForm />
      <ToastContainer position="bottom-center" />
    </>
  )
}