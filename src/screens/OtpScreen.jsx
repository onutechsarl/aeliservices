import React from 'react';
import { ToastContainer } from 'react-toastify';
import { OtpForm } from '../components/auth/OtpForm';

/**
 * UI component responsible for rendering otp screen.
 */
export function OtpScreen() {
    return (
        <>
            <OtpForm />
            <ToastContainer position="bottom-center" />
        </>
    )
}