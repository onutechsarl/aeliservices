import { motion, AnimatePresence } from 'framer-motion';

/**
 * UI component responsible for rendering animated.
 */
export function Animated({ children }) {
  return (
    <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}

          className="z-[100] relative" 
        >
          {children}
        </motion.div>
    </AnimatePresence>
  );
}