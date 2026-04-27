import React from 'react';
import { ToastContainer } from 'react-toastify';
import { Subscription } from '../components/Subscription/Subscription';

/**
 * UI component responsible for rendering subscription screen.
 */
export function SubscriptionScreen() {
    return (
        <div >
            <Subscription />
            <ToastContainer position="bottom-center" />
        </div>
    )
}
