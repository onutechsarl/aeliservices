import React from 'react';
import { ToastContainer } from 'react-toastify';
import { Subscription } from '../components/Subscription/Subscription';

/**
 * UI component responsible for rendering subscription screen.
 */
export function SubscriptionScreen() {
    return (
        <div className="p-4 sm:p-0">
            <Subscription />
            <ToastContainer position="bottom-center" />
        </div>
    )
}
