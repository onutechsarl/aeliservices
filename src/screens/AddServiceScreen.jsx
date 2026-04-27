import React from 'react';
import { ToastContainer } from 'react-toastify';
import { ServiceInfoForm } from "../components/AddService/ServiceInfoForm";

/**
 * UI component responsible for rendering add service screen.
 */
export function AddServiceScreen() {
    return (
        <>
            <ServiceInfoForm />
            <ToastContainer position="bottom-center" />
        </>
    )
}