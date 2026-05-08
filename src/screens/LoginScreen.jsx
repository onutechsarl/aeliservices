import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { LoginForm } from '../components/auth/LoginForm';

/**
 * Vérifie si un JWT est encore valide via son champ exp.
 */
const isTokenValid = (token) => {
  if (!token) return false;

  try {
    const payloadBase64 = token.split('.')[1];
    if (!payloadBase64) return false;

    const payloadJson = atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(payloadJson);

    if (!payload?.exp) return false;

    const nowInSeconds = Math.floor(Date.now() / 1000);
    return payload.exp > nowInSeconds;
  } catch (error) {
    return false;
  }
};

/**
 * UI component responsible for rendering login screen.
 */
export function LoginScreen() {
  const navigate = useNavigate();

  useEffect(() => {
    const accessToken = localStorage.getItem('accessTokenAeliServices');

    if (isTokenValid(accessToken)) {
      navigate('/home', { replace: true });
    }
  }, [navigate]);

  return (
    <>
      <LoginForm />
      <ToastContainer position="bottom-center" />
    </>
  )
}
