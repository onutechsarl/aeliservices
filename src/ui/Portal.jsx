import { createPortal } from 'react-dom';

/**
 * UI component responsible for rendering portal.
 */
export const Portal = ({ children }) => {
    return createPortal(children, document.body);
};