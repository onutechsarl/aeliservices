import React from 'react';
import { ToastContainer } from 'react-toastify';
import { CategoryInfoForm } from "../components/AddCategory/CategoryInfoForm";

/**
 * UI component responsible for rendering add categorycreen.
 */
export function AddCategorycreen() {
    return (
        <>
            <CategoryInfoForm />
            <ToastContainer position="bottom-center" />
        </>
    )
}