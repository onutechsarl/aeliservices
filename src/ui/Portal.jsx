import { createPortal } from "react-dom";

/**
 * UI component responsible for rendering the portal section.
 */
export const Portal = ({ children }) => {
  return createPortal(children, document.body);
};
